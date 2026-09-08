// Mock data + business logic for the UI to build against before the real backend
// is wired up. Mirrors services/bookingService.ts, services/roomService.ts, and
// services/billingService.ts as closely as possible on purpose — see CLAUDE.md's
// contract-workflow ("build against mock data first, swap to real fetch calls once
// ready"). This file is UI-owned (lives under components/), not backend-owned —
// it never touches lib/db.ts or prisma/.
//
// Persisted to a local, gitignored JSON file rather than a module-level array:
// Next.js dev mode doesn't guarantee a Server Action invocation and a page's
// Server Component render share the same module instance, so an in-memory array
// silently "lost" writes (verified — a booking created via the form never showed
// up on the list page). A small file read/write on every call sidesteps that
// entirely and is more than fast enough for mock data.
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { Booking, Folio, Guest, ExtraService } from "@/types/booking";
import { MOCK_BOOKINGS } from "@/types/booking";
import type { Room } from "@/types/room";
import { MOCK_ROOMS } from "@/types/room";

interface Store {
  bookings: Booking[];
  rooms: Room[];
  folios: Folio[];
  nextId: number;
}

const STORE_PATH = path.join(process.cwd(), ".mock-store.json");

function loadStore(): Store {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { bookings: [...MOCK_BOOKINGS], rooms: [...MOCK_ROOMS], folios: [], nextId: 100 };
  }
}

function saveStore(store: Store): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function newId(store: Store, prefix: string): string {
  store.nextId += 1;
  return `${prefix}${store.nextId}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// ---- Rooms ----

export function listRoomsMock(): Room[] {
  const store = loadStore();
  return [...store.rooms].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

// ---- Dashboard summary ----
// All figures computed from real mock data — no invented deltas. When a
// comparison period has zero of something, the percentage is left undefined
// rather than showing a fake 0%/Infinity.
export interface DashboardStats {
  totalBookings: number;
  totalBookingsDeltaPct?: number;
  totalRevenue: number;
  totalRevenueDeltaPct?: number;
  totalGuests: number;
  totalGuestsDeltaPct?: number;
  occupancyRate: number;
  activeRoomCount: number;
  adr: number;
  revPAR: number;
  revenueByDay: { date: string; amount: number }[];
  roomStatus: { available: number; occupied: number; maintenance: number };
  arrivalsToday: Booking[];
  departuresToday: Booking[];
}

function pctDelta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDashboardStatsMock(): DashboardStats {
  const store = loadStore();
  const bookings = store.bookings.filter((b) => b.status !== "cancelled");
  const today = toISODate(new Date());
  const last7Start = daysAgo(6);
  const prev7Start = daysAgo(13);
  const prev7End = daysAgo(7);

  const inLast7 = (b: Booking) => b.createdAt.slice(0, 10) >= last7Start && b.createdAt.slice(0, 10) <= today;
  const inPrev7 = (b: Booking) => b.createdAt.slice(0, 10) >= prev7Start && b.createdAt.slice(0, 10) <= prev7End;

  const last7Bookings = bookings.filter(inLast7);
  const prev7Bookings = bookings.filter(inPrev7);

  const totalRevenueLast7 = last7Bookings.reduce((sum, b) => sum + b.amount, 0);
  const totalRevenuePrev7 = prev7Bookings.reduce((sum, b) => sum + b.amount, 0);

  const uniquePhones = (list: Booking[]) => new Set(list.map((b) => b.guest.phone)).size;

  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    const amount = bookings
      .filter((b) => b.checkIn === date)
      .reduce((sum, b) => sum + b.amount, 0);
    return { date, amount };
  });

  const activeRooms = store.rooms.filter((r) => r.active);
  const occupiedRoomNumbers = new Set(
    store.bookings
      .filter((b) => b.status === "checked-in" && b.checkIn <= today && today < b.checkOut)
      .map((b) => b.roomNumber)
  );
  const occupied = activeRooms.filter((r) => occupiedRoomNumbers.has(r.roomNumber)).length;
  const maintenance = store.rooms.length - activeRooms.length;
  const available = activeRooms.length - occupied;

  // ADR (Average Daily Rate) = revenue / room-nights sold, RevPAR = revenue /
  // room-nights available — both over the same last-7-day window as the other
  // stats, computed from real bookings, not invented.
  const roomNightsSold = last7Bookings.reduce((sum, b) => sum + nightsBetween(b.checkIn, b.checkOut), 0);
  const adr = roomNightsSold > 0 ? Math.round(totalRevenueLast7 / roomNightsSold) : 0;
  const roomNightsAvailable = activeRooms.length * 7;
  const revPAR = roomNightsAvailable > 0 ? Math.round(totalRevenueLast7 / roomNightsAvailable) : 0;

  const arrivalsToday = bookings.filter((b) => b.checkIn === today);
  const departuresToday = bookings.filter((b) => b.checkOut === today);

  return {
    totalBookings: last7Bookings.length,
    totalBookingsDeltaPct: pctDelta(last7Bookings.length, prev7Bookings.length),
    totalRevenue: totalRevenueLast7,
    totalRevenueDeltaPct: pctDelta(totalRevenueLast7, totalRevenuePrev7),
    totalGuests: uniquePhones(last7Bookings),
    totalGuestsDeltaPct: pctDelta(uniquePhones(last7Bookings), uniquePhones(prev7Bookings)),
    occupancyRate: activeRooms.length > 0 ? Math.round((occupied / activeRooms.length) * 100) : 0,
    activeRoomCount: activeRooms.length,
    adr,
    revPAR,
    revenueByDay,
    roomStatus: { available, occupied, maintenance },
    arrivalsToday,
    departuresToday,
  };
}

// ---- Customers (derived, not a separate stored entity yet) ----
// Aggregated from bookings by phone number — see the guest-identity note above
// (getGuestBookingsByPhoneMock) for why phone, not a real guest id.
export interface CustomerSummary {
  name: string;
  phone: string;
  email?: string;
  idType?: Guest["idType"];
  stays: number;
  totalSpend: number;
}

export function listCustomersMock(): CustomerSummary[] {
  const store = loadStore();
  const byPhone = new Map<string, CustomerSummary>();
  for (const b of store.bookings) {
    const existing = byPhone.get(b.guest.phone);
    if (existing) {
      existing.stays += 1;
      existing.totalSpend += b.status !== "cancelled" ? b.amount : 0;
      if (!existing.email && b.guest.email) existing.email = b.guest.email;
      if (!existing.idType && b.guest.idType) existing.idType = b.guest.idType;
    } else {
      byPhone.set(b.guest.phone, {
        name: b.guest.name,
        phone: b.guest.phone,
        email: b.guest.email,
        idType: b.guest.idType,
        stays: 1,
        totalSpend: b.status !== "cancelled" ? b.amount : 0,
      });
    }
  }
  return [...byPhone.values()].sort((a, b) => b.stays - a.stays);
}

function getActiveRoomRate(store: Store, roomNumber: string): number {
  const room = store.rooms.find((r) => r.roomNumber === roomNumber);
  if (!room) throw new Error(`Room ${roomNumber} does not exist`);
  if (!room.active) throw new Error(`Room ${roomNumber} is not active (maintenance/blocked)`);
  return room.ratePerNight;
}

export function createRoomMock(input: { roomNumber: string; roomType: string; ratePerNight: number }): Room {
  const store = loadStore();
  if (store.rooms.some((r) => r.roomNumber === input.roomNumber)) {
    throw new Error("Room number already exists");
  }
  const room: Room = { id: newId(store, "r"), active: true, ...input };
  store.rooms.push(room);
  saveStore(store);
  return room;
}

// ---- Bookings ----

export function listBookingsMock(): Booking[] {
  const store = loadStore();
  return [...store.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingMock(id: string): Booking | undefined {
  return loadStore().bookings.find((b) => b.id === id);
}

// There's no stable cross-booking guest identity in this mock model yet (each
// booking creates its own Guest record, same as the real schema today) — phone
// number is the closest available proxy for "same person, repeat visit."
export function getGuestBookingsByPhoneMock(phone: string): Booking[] {
  return loadStore()
    .bookings.filter((b) => b.guest.phone === phone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Front-desk lifecycle: confirmed -> checked-in -> checked-out, or confirmed ->
// cancelled/no-show. waitlisted -> confirmed once a room is actually promised,
// or -> cancelled if the guest drops. Mirrors what a real PATCH
// /api/bookings/:id/status would enforce server-side.
const ALLOWED_TRANSITIONS: Record<Booking["status"], Booking["status"][]> = {
  confirmed: ["checked-in", "cancelled", "no-show"],
  waitlisted: ["confirmed", "cancelled"],
  "checked-in": ["checked-out"],
  "checked-out": [],
  cancelled: [],
  "no-show": [],
};

export function updateBookingStatusMock(id: string, nextStatus: Booking["status"]): Booking {
  const store = loadStore();
  const booking = store.bookings.find((b) => b.id === id);
  if (!booking) throw new Error("Booking not found");
  if (!ALLOWED_TRANSITIONS[booking.status].includes(nextStatus)) {
    throw new Error(`Cannot move a ${booking.status} booking to ${nextStatus}`);
  }
  booking.status = nextStatus;
  saveStore(store);
  return booking;
}

export function createBookingMock(input: {
  guest: Pick<Guest, "name" | "phone" | "email" | "idType" | "idNumber">;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  source?: Booking["source"];
  notes?: string;
  // Walk-in bookings skip straight to checked-in (guest is standing at the
  // desk, already given a room); waitlisted skips the room-availability
  // assumption entirely (a request against a specific room, not yet promised).
  // Defaults to "confirmed" — the normal reservation path.
  initialStatus?: "confirmed" | "checked-in" | "waitlisted";
  // Pricing control — front desk can charge something other than the room's
  // list rate (negotiated/corporate rate, walk-in haggle, error correction)
  // and apply a flat discount. This is NOT "trusting a client-sent amount":
  // the caller proposes a rate/discount, the server still derives `amount`
  // from a formula and clamps every input to a sane, non-negative range —
  // never accepts a final total directly.
  rateOverride?: number; // per-night rate to charge instead of the room's listed rate
  discountAmount?: number; // flat rupee discount off the subtotal, clamped to [0, subtotal]
  extraServices?: ExtraService[];
  paymentStatus?: Booking["paymentStatus"];
  priceNote?: string;
}): Booking {
  const store = loadStore();
  // Room rate is looked up server-side (here: mock-server-side) by roomNumber —
  // still validates the room is real/active even when a rate override is used.
  // See CLAUDE.md's "never trust an amount from the client" rule.
  const roomRatePerNight = getActiveRoomRate(store, input.roomNumber);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const effectiveRate = input.rateOverride && input.rateOverride > 0 ? input.rateOverride : roomRatePerNight;
  const subtotal = effectiveRate * nights;
  const discountAmount = Math.min(Math.max(input.discountAmount ?? 0, 0), subtotal);
  const amount = subtotal - discountAmount;

  const guest: Guest = { id: newId(store, "g"), ...input.guest };
  const booking: Booking = {
    id: newId(store, "b"),
    guest,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    roomNumber: input.roomNumber,
    status: input.initialStatus ?? "confirmed",
    amount,
    createdAt: new Date().toISOString(),
    source: input.source,
    notes: input.notes,
    extraServices: input.extraServices,
    paymentStatus: input.paymentStatus,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    priceNote: input.priceNote,
  };
  store.bookings.push(booking);
  saveStore(store);
  return booking;
}

// ---- Reschedule (extend/shorten stay, move room, drag-and-drop on the calendar) ----
// One function covers all three because they're the same operation underneath:
// change where/when a booking sits, recompute the amount from the (possibly
// new) room's real rate — never trust a client-sent amount, same rule as create.
export function rescheduleBookingMock(
  id: string,
  updates: { roomNumber?: string; checkIn?: string; checkOut?: string }
): Booking {
  const store = loadStore();
  const booking = store.bookings.find((b) => b.id === id);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === "checked-out" || booking.status === "cancelled" || booking.status === "no-show") {
    throw new Error(`Cannot reschedule a ${booking.status} booking`);
  }

  const roomNumber = updates.roomNumber ?? booking.roomNumber;
  const checkIn = updates.checkIn ?? booking.checkIn;
  const checkOut = updates.checkOut ?? booking.checkOut;
  if (checkOut <= checkIn) throw new Error("Check-out must be after check-in");

  const ratePerNight = getActiveRoomRate(store, roomNumber);
  const nights = nightsBetween(checkIn, checkOut);

  booking.roomNumber = roomNumber;
  booking.checkIn = checkIn;
  booking.checkOut = checkOut;
  booking.amount = ratePerNight * nights;
  saveStore(store);
  return booking;
}

// ---- Group bookings ----
// A group booking is N ordinary Booking rows sharing a groupId/groupName —
// no separate "Group" entity in the contract, kept deliberately minimal.
export interface GroupBookingSummary {
  groupId: string;
  groupName: string;
  bookings: Booking[];
  totalRooms: number;
  totalAmount: number;
}

export function listGroupBookingsMock(): GroupBookingSummary[] {
  const store = loadStore();
  const byGroup = new Map<string, GroupBookingSummary>();
  for (const b of store.bookings) {
    if (!b.groupId) continue;
    const existing = byGroup.get(b.groupId);
    if (existing) {
      existing.bookings.push(b);
      existing.totalRooms += 1;
      existing.totalAmount += b.status !== "cancelled" ? b.amount : 0;
    } else {
      byGroup.set(b.groupId, {
        groupId: b.groupId,
        groupName: b.groupName ?? "Group booking",
        bookings: [b],
        totalRooms: 1,
        totalAmount: b.status !== "cancelled" ? b.amount : 0,
      });
    }
  }
  return [...byGroup.values()].sort((a, b) => b.bookings[0].createdAt.localeCompare(a.bookings[0].createdAt));
}

export function createGroupBookingMock(input: {
  groupName: string;
  contact: Pick<Guest, "name" | "phone" | "email">;
  rooms: { roomNumber: string; checkIn: string; checkOut: string }[];
}): GroupBookingSummary {
  if (input.rooms.length < 2) throw new Error("A group booking needs at least 2 rooms");
  const store = loadStore();
  const groupId = newId(store, "grp");

  // Validate every room up front so a group booking never partially fails —
  // either all rooms book, or none do.
  for (const room of input.rooms) {
    getActiveRoomRate(store, room.roomNumber);
    if (room.checkOut <= room.checkIn) {
      throw new Error(`Room ${room.roomNumber}: check-out must be after check-in`);
    }
  }

  const bookings: Booking[] = input.rooms.map((room) => {
    const ratePerNight = getActiveRoomRate(store, room.roomNumber);
    const nights = nightsBetween(room.checkIn, room.checkOut);
    const guest: Guest = { id: newId(store, "g"), ...input.contact };
    return {
      id: newId(store, "b"),
      guest,
      checkIn: room.checkIn,
      checkOut: room.checkOut,
      roomNumber: room.roomNumber,
      status: "confirmed",
      amount: ratePerNight * nights,
      createdAt: new Date().toISOString(),
      source: "direct",
      groupId,
      groupName: input.groupName,
    };
  });

  store.bookings.push(...bookings);
  saveStore(store);
  return {
    groupId,
    groupName: input.groupName,
    bookings,
    totalRooms: bookings.length,
    totalAmount: bookings.reduce((sum, b) => sum + b.amount, 0),
  };
}

// ---- Waitlist, no-shows, overbooking (all computed, nothing fabricated) ----

export function listWaitlistMock(): Booking[] {
  return loadStore()
    .bookings.filter((b) => b.status === "waitlisted")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

// A "possible no-show" is a confirmed booking whose check-in date has already
// passed without the guest ever being checked in. This is a suggestion for
// staff to review, not an automatic status change — marking it "no-show" is
// still a manual action (see ALLOWED_TRANSITIONS).
export function findPossibleNoShowsMock(today = toISODate(new Date())): Booking[] {
  return loadStore().bookings.filter((b) => b.status === "confirmed" && b.checkIn < today);
}

export interface OverbookingConflict {
  roomNumber: string;
  a: Booking;
  b: Booking;
}

// Two non-cancelled, non-checked-out, non-no-show bookings on the same room
// with overlapping date ranges. There's no availability check on booking
// creation yet (a real endpoint would reject this outright) — this surfaces
// the conflict after the fact so front desk can resolve it (move one booking).
export function findOverbookingConflictsMock(): OverbookingConflict[] {
  const store = loadStore();
  const relevant = store.bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "checked-out" && b.status !== "no-show"
  );
  const byRoom = new Map<string, Booking[]>();
  for (const b of relevant) {
    const list = byRoom.get(b.roomNumber) ?? [];
    list.push(b);
    byRoom.set(b.roomNumber, list);
  }
  const conflicts: OverbookingConflict[] = [];
  for (const [roomNumber, bookings] of byRoom) {
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const a = bookings[i];
        const b = bookings[j];
        const overlaps = a.checkIn < b.checkOut && b.checkIn < a.checkOut;
        if (overlaps) conflicts.push({ roomNumber, a, b });
      }
    }
  }
  return conflicts;
}

// ---- Folio / GST billing ----
// Same slab + SAC code as services/billingService.ts.
const GST_LOW_RATE = 12;
const GST_HIGH_RATE = 18;
const GST_THRESHOLD = 7500;
const SAC_CODE_ACCOMMODATION = "996311";

function gstRateForRoomRate(roomRatePerNight: number): number {
  return roomRatePerNight > GST_THRESHOLD ? GST_HIGH_RATE : GST_LOW_RATE;
}

export function getFolioMock(bookingId: string): Folio | undefined {
  return loadStore().folios.find((f) => f.bookingId === bookingId);
}

export function generateFolioMock(bookingId: string): Folio {
  const store = loadStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("Booking not found");

  // Idempotent EXCEPT for a voided folio — a void means "this invoice was
  // wrong, issue a new one," so a voided record no longer blocks regeneration.
  // The voided one stays in `store.folios` for audit history either way.
  const existing = store.folios.find((f) => f.bookingId === bookingId && !f.voided);
  if (existing) return existing; // idempotent — never double-bill

  // GST slab is based on the actual per-night value charged (the "declared
  // tariff"), not the room's static list rate — so a manually overridden or
  // discounted rate correctly shifts which slab applies, same as it would for
  // a real hotel. Falls back to the room's list rate only if nights can't be
  // derived (shouldn't happen for a real booking).
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const room = store.rooms.find((r) => r.roomNumber === booking.roomNumber);
  const roomRatePerNight = nights > 0 ? booking.amount / nights : room ? room.ratePerNight : booking.amount;

  const baseAmount = booking.amount;
  const gstRate = gstRateForRoomRate(roomRatePerNight);
  const taxAmount = Math.round((baseAmount * gstRate) / 100);
  const cgst = Math.round(taxAmount / 2);
  const sgst = taxAmount - cgst; // avoids a rupee going missing to rounding

  const year = new Date().getFullYear();
  const folio: Folio = {
    id: newId(store, "f"),
    bookingId,
    invoiceNumber: `BN-${year}-${String(store.folios.length + 1).padStart(5, "0")}`,
    sacCode: SAC_CODE_ACCOMMODATION,
    baseAmount,
    gstRate,
    gstType: "CGST_SGST",
    cgst,
    sgst,
    igst: 0,
    totalAmount: baseAmount + taxAmount,
    createdAt: new Date().toISOString(),
  };
  store.folios.push(folio);
  saveStore(store);
  return folio;
}

// All folios ever generated, including voided ones — used for the GSTR-1
// export (which explicitly excludes voided rows) and for audit history.
export function listFoliosMock(): Folio[] {
  return [...loadStore().folios].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function voidFolioMock(bookingId: string, reason: string): Folio {
  const store = loadStore();
  const folio = store.folios.find((f) => f.bookingId === bookingId && !f.voided);
  if (!folio) throw new Error("No active invoice to void for this booking");
  folio.voided = true;
  folio.voidReason = reason;
  saveStore(store);
  return folio;
}

// ---- CSV import ("Nothing Lost" report) ----
// Mirrors services/importService.ts's header-alias matching so the mock behaves
// like the real importer would.
export interface ImportReport {
  totalRows: number;
  imported: { row: number; bookingId: string; guestName: string; roomNumber: string }[];
  flagged: { row: number; reason: string; raw: Record<string, string> }[];
  roomsCreated: string[];
}

const HEADER_ALIASES: Record<string, string[]> = {
  guestName: ["name", "guest name", "guest", "customer name", "customer"],
  phone: ["phone", "mobile", "contact", "phone number", "mobile number"],
  checkIn: ["checkin", "check-in", "check in", "arrival", "arrival date", "from"],
  checkOut: ["checkout", "check-out", "check out", "departure", "departure date", "to"],
  roomNumber: ["room", "room no", "room number", "room no.", "room#"],
  rate: ["rate", "amount", "price", "rate per night", "room rate", "tariff"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function findField(row: Record<string, string>, field: keyof typeof HEADER_ALIASES): string | undefined {
  const aliases = HEADER_ALIASES[field];
  for (const key of Object.keys(row)) {
    if (aliases.includes(normalizeHeader(key))) return row[key]?.trim();
  }
  return undefined;
}

function parseFlexibleDate(raw: string): string | undefined {
  const trimmed = raw.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(trimmed)) return trimmed;
  const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const match = trimmed.match(dmy);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return undefined;
}

export function importCsvMock(csvText: string): ImportReport {
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const report: ImportReport = { totalRows: rows.length, imported: [], flagged: [], roomsCreated: [] };

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index];
    const rowNum = index + 1;
    const guestName = findField(raw, "guestName");
    const phone = findField(raw, "phone");
    const checkInRaw = findField(raw, "checkIn");
    const checkOutRaw = findField(raw, "checkOut");
    const roomNumber = findField(raw, "roomNumber");
    const rateRaw = findField(raw, "rate");

    if (!guestName || !phone || !checkInRaw || !checkOutRaw || !roomNumber) {
      report.flagged.push({ row: rowNum, reason: "Missing a required field (name/phone/dates/room)", raw });
      continue;
    }

    const checkIn = parseFlexibleDate(checkInRaw);
    const checkOut = parseFlexibleDate(checkOutRaw);
    if (!checkIn || !checkOut) {
      report.flagged.push({ row: rowNum, reason: "Unrecognised date format", raw });
      continue;
    }

    let resolvedRoomNumber = roomNumber;
    const roomExists = listRoomsMock().some((r) => r.roomNumber === roomNumber);
    if (!roomExists) {
      const rate = rateRaw ? Number(rateRaw.replace(/[^0-9.]/g, "")) : NaN;
      if (!rate || Number.isNaN(rate) || rate <= 0) {
        report.flagged.push({ row: rowNum, reason: `Unknown room ${roomNumber} and no rate given`, raw });
        continue;
      }
      try {
        const created = createRoomMock({ roomNumber, roomType: "Imported", ratePerNight: rate });
        resolvedRoomNumber = created.roomNumber;
        report.roomsCreated.push(roomNumber);
      } catch (err) {
        report.flagged.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : "Could not create room for this row",
          raw,
        });
        continue;
      }
    }

    try {
      const booking = createBookingMock({
        guest: { name: guestName, phone },
        checkIn,
        checkOut,
        roomNumber: resolvedRoomNumber,
      });
      report.imported.push({ row: rowNum, bookingId: booking.id, guestName, roomNumber: resolvedRoomNumber });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not import this row";
      report.flagged.push({ row: rowNum, reason: message, raw });
    }
  }

  return report;
}
