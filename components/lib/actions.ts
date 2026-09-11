"use server";

// Server Actions the UI forms call directly. Validation here mirrors the real
// app/api/bookings & app/api/rooms zod schemas exactly, so swapping these bodies
// for real fetch() calls later is close to a one-line change per call site.
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  generateFolioMock,
  importCsvMock,
  listBookingsMock,
  listRoomsMock,
  voidFolioMock,
} from "@/components/lib/mockData";
import { createRoom } from "@/services/roomService";
import { createBooking, rescheduleBooking, updateBookingStatus, createGroupBooking, undoBookingStatus } from "@/services/bookingService";
import { requireStaffForAction } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";
import { recordPaymentMock, issueCreditNoteMock, PAYMENT_METHODS } from "@/components/lib/paymentsMock";
import type { PaymentMethod, PaymentType } from "@/components/lib/paymentsMock";
import {
  setOpeningBalanceMock,
  addCashPaidOutMock,
  closeRegisterMock,
} from "@/components/lib/cashRegisterMock";
import {
  setStopSellMock,
  setAllChannelsStopSellMock,
  setChannelStopSellMock,
} from "@/components/lib/channelInventoryMock";
import type { ImportReport } from "@/components/lib/mockData";
import type { Booking } from "@/types/booking";
import { advanceHousekeepingStatusMock, assignHousekeepingStaffMock } from "@/components/lib/housekeepingMock";
import type { HousekeepingStatus } from "@/components/lib/housekeepingMock";
import {
  createMaintenanceTicketMock,
  updateMaintenanceTicketStatusMock,
  assignMaintenanceTechnicianMock,
} from "@/components/lib/maintenanceMock";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from "@/constants/maintenance";
import type { MaintenanceStatus, MaintenanceTicket } from "@/components/lib/maintenanceMock";

type ActionResult = { ok: true } | { ok: false; error: string };

const createBookingSchema = z.object({
  guest: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
    email: z.string().email().optional().or(z.literal("")),
    idType: z.enum(["aadhaar", "passport", "driving_license", "voter_id", "other"]).optional(),
    idNumber: z.string().max(50).optional().or(z.literal("")),
  }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  roomNumber: z.string().min(1).max(20),
  notes: z.string().max(500).optional().or(z.literal("")),
  // Pricing control — see createBookingMock's comment: this proposes a rate/
  // discount, the server still derives the final amount from a formula.
  rateOverride: z.number().positive().max(1000000).optional(),
  discountAmount: z.number().min(0).max(1000000).optional(),
  extraServices: z
    .array(z.object({ name: z.string().min(1).max(80), amount: z.number().positive().max(1000000) }))
    .max(10)
    .optional(),
  paymentStatus: z.enum(["prepaid", "postpaid", "partial"]).optional(),
  priceNote: z.string().max(300).optional().or(z.literal("")),
});

export async function createBookingAction(input: {
  guest: { name: string; phone: string; email?: string; idType?: string; idNumber?: string };
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  notes?: string;
  rateOverride?: number;
  discountAmount?: number;
  extraServices?: { name: string; amount: number }[];
  paymentStatus?: "prepaid" | "postpaid" | "partial";
  priceNote?: string;
}): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }
  let bookingId: string;
  try {
    const booking = await createBooking({
      ...parsed.data,
      guest: {
        ...parsed.data.guest,
        email: parsed.data.guest.email || undefined,
        idNumber: parsed.data.guest.idNumber || undefined,
      },
      notes: parsed.data.notes || undefined,
      priceNote: parsed.data.priceNote || undefined,
      source: "direct",
    });
    bookingId = booking.id;
    await logAction({ staffId: staff.id, action: "booking.create", entityType: "Booking", entityId: booking.id, details: { roomNumber: booking.roomNumber, amount: booking.amount } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create booking" };
  }
  redirect(`/bookings/${bookingId}/folio`);
}

const createWalkInSchema = createBookingSchema;

export async function createWalkInBookingAction(input: {
  guest: { name: string; phone: string; email?: string; idType?: string; idNumber?: string };
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  notes?: string;
  paymentStatus?: "prepaid" | "postpaid" | "partial";
}): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  const parsed = createWalkInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }
  try {
    const booking = await createBooking({
      ...parsed.data,
      guest: {
        ...parsed.data.guest,
        email: parsed.data.guest.email || undefined,
        idNumber: parsed.data.guest.idNumber || undefined,
      },
      notes: parsed.data.notes || undefined,
      source: "walk-in",
      initialStatus: "checked-in",
    });
    await logAction({ staffId: staff.id, action: "booking.create_walkin", entityType: "Booking", entityId: booking.id, details: { roomNumber: booking.roomNumber } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create walk-in booking" };
  }
  redirect("/bookings");
}

const createGroupBookingSchema = z.object({
  groupName: z.string().min(1).max(120),
  contact: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
    email: z.string().email().optional().or(z.literal("")),
  }),
  rooms: z
    .array(
      z.object({
        roomNumber: z.string().min(1).max(20),
        checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
        checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
      })
    )
    .min(2, "A group booking needs at least 2 rooms"),
});

export async function createGroupBookingAction(input: {
  groupName: string;
  contact: { name: string; phone: string; email?: string };
  rooms: { roomNumber: string; checkIn: string; checkOut: string }[];
}): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  const parsed = createGroupBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid group booking details" };
  }
  try {
    const bookings = await createGroupBooking({
      groupName: parsed.data.groupName,
      guest: { ...parsed.data.contact, email: parsed.data.contact.email || undefined },
      rooms: parsed.data.rooms,
    });
    await logAction({
      staffId: staff.id,
      action: "booking.create_group",
      entityType: "BookingGroup",
      entityId: bookings[0]?.groupId ?? "unknown",
      details: { groupName: parsed.data.groupName, roomCount: bookings.length },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create group booking" };
  }
  redirect("/bookings/groups");
}

export async function rescheduleBookingAction(
  id: string,
  updates: { roomNumber?: string; checkIn?: string; checkOut?: string }
): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  try {
    await rescheduleBooking(id, updates);
    await logAction({ staffId: staff.id, action: "booking.reschedule", entityType: "Booking", entityId: id, details: updates });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reschedule booking" };
  }
  revalidatePath("/bookings");
  revalidatePath("/bookings/calendar");
  revalidatePath("/bookings/groups");
  revalidatePath("/dashboard");
  return { ok: true };
}

const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  roomType: z.string().min(1).max(60),
  ratePerNight: z.number().int().positive().max(1000000),
});

export async function createRoomAction(input: {
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
}): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid room details" };
  }
  try {
    const room = await createRoom(parsed.data);
    await logAction({ staffId: staff.id, action: "room.create", entityType: "Room", entityId: room.id, details: { roomNumber: room.roomNumber } });
  } catch {
    return { ok: false, error: "Room number already exists" };
  }
  redirect("/rooms");
}

export async function updateBookingStatusAction(id: string, nextStatus: Booking["status"]): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  try {
    await updateBookingStatus(id, nextStatus);
    await logAction({ staffId: staff.id, action: "booking.status_change", entityType: "Booking", entityId: id, details: { to: nextStatus } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update booking" };
  }
  revalidatePath("/bookings");
  revalidatePath("/bookings/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Safety-net undo, one step back only (check-in or check-out), blocked once a
// folio exists for the booking — see bookingService.undoBookingStatus for the
// full reasoning. Separate from updateBookingStatusAction on purpose so the
// audit log can distinguish "reverted a mis-click" from a normal lifecycle move.
export async function undoBookingStatusAction(id: string): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaffForAction();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authenticated" };
  }
  try {
    const booking = await undoBookingStatus(id);
    await logAction({ staffId: staff.id, action: "booking.undo_status", entityType: "Booking", entityId: id, details: { revertedTo: booking.status } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not undo" };
  }
  revalidatePath("/bookings");
  revalidatePath("/bookings/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function generateFolioAction(bookingId: string) {
  return generateFolioMock(bookingId);
}

export async function importCsvAction(csvText: string): Promise<ImportReport> {
  return importCsvMock(csvText);
}

export interface SearchResult {
  type: "booking" | "room";
  label: string;
  sublabel: string;
  href: string;
}

// Powers the topbar search — a real, functional search over mock bookings and
// rooms (not decoration). Called directly from AppShell (a client component)
// as a Server Action, so no app/api/ route is needed for this (that folder is
// Abhay's lane — see CLAUDE.md's team split).
export async function searchMockAction(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const bookingResults: SearchResult[] = listBookingsMock()
    .filter((b) => b.guest.name.toLowerCase().includes(q) || b.guest.phone.includes(q) || b.roomNumber.includes(q))
    .slice(0, 5)
    .map((b) => ({
      type: "booking",
      label: b.guest.name,
      sublabel: `Room ${b.roomNumber} · ${b.checkIn}`,
      href: `/bookings/${b.id}/folio`,
    }));

  const roomResults: SearchResult[] = listRoomsMock()
    .filter((r) => r.roomNumber.includes(q) || r.roomType.toLowerCase().includes(q))
    .slice(0, 5)
    .map((r) => ({
      type: "room",
      label: `Room ${r.roomNumber}`,
      sublabel: r.roomType,
      href: "/rooms",
    }));

  return [...bookingResults, ...roomResults].slice(0, 8);
}

// ---- Housekeeping ----

export async function advanceHousekeepingStatusAction(id: string, next: HousekeepingStatus): Promise<ActionResult> {
  try {
    advanceHousekeepingStatusMock(id, next);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update housekeeping status" };
  }
  revalidatePath("/housekeeping");
  return { ok: true };
}

export async function assignHousekeepingStaffAction(id: string, staffName: string): Promise<ActionResult> {
  try {
    assignHousekeepingStaffMock(id, staffName);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not assign staff" };
  }
  revalidatePath("/housekeeping");
  return { ok: true };
}

// ---- Maintenance ----

const createMaintenanceTicketSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  category: z.enum(MAINTENANCE_CATEGORIES),
  description: z.string().min(1).max(500),
  priority: z.enum(MAINTENANCE_PRIORITIES),
});

export async function createMaintenanceTicketAction(input: {
  roomNumber: string;
  category: MaintenanceTicket["category"];
  description: string;
  priority: MaintenanceTicket["priority"];
}): Promise<ActionResult> {
  const parsed = createMaintenanceTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ticket details" };
  }
  try {
    createMaintenanceTicketMock(parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create ticket" };
  }
  revalidatePath("/maintenance");
  return { ok: true };
}

export async function updateMaintenanceTicketStatusAction(
  id: string,
  next: MaintenanceStatus,
  cost?: number
): Promise<ActionResult> {
  try {
    updateMaintenanceTicketStatusMock(id, next, cost);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update ticket" };
  }
  revalidatePath("/maintenance");
  return { ok: true };
}

export async function assignMaintenanceTechnicianAction(id: string, technician: string): Promise<ActionResult> {
  try {
    assignMaintenanceTechnicianMock(id, technician);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not assign technician" };
  }
  revalidatePath("/maintenance");
  return { ok: true };
}

// ---- Payments, refunds, void invoice ----

const recordPaymentSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  type: z.enum(["advance", "partial", "full"]),
  amount: z.number().positive().max(1000000),
  note: z.string().max(200).optional().or(z.literal("")),
});

export async function recordPaymentAction(input: {
  bookingId: string;
  method: PaymentMethod;
  type: Exclude<PaymentType, "refund">;
  amount: number;
  note?: string;
}): Promise<ActionResult> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment details" };
  }
  try {
    recordPaymentMock({ ...parsed.data, note: parsed.data.note || undefined });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not record payment" };
  }
  revalidatePath(`/bookings/${input.bookingId}/folio`);
  revalidatePath("/reports");
  revalidatePath("/cash-register");
  return { ok: true };
}

const refundSchema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  amount: z.number().positive().max(1000000),
  reason: z.string().min(1).max(300),
});

// A refund against an invoiced booking legally needs a credit note in India
// (you can't just shrink an already-issued GST invoice) — so this records the
// refund payment AND issues the matching credit note in one step, rather than
// leaving it to the caller to remember both.
export async function refundBookingAction(input: {
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  reason: string;
}): Promise<ActionResult> {
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid refund details" };
  }
  try {
    recordPaymentMock({
      bookingId: parsed.data.bookingId,
      method: parsed.data.method,
      type: "refund",
      amount: parsed.data.amount,
      note: parsed.data.reason,
    });
    issueCreditNoteMock(parsed.data.bookingId, parsed.data.amount, parsed.data.reason);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not process refund" };
  }
  revalidatePath(`/bookings/${input.bookingId}/folio`);
  revalidatePath("/reports");
  revalidatePath("/cash-register");
  return { ok: true };
}

export async function voidFolioAction(bookingId: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: "A reason is required to void an invoice" };
  try {
    voidFolioMock(bookingId, reason);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not void invoice" };
  }
  revalidatePath(`/bookings/${bookingId}/folio`);
  revalidatePath("/reports");
  return { ok: true };
}

// ---- Cash register ----

export async function setOpeningBalanceAction(amount: number): Promise<ActionResult> {
  try {
    setOpeningBalanceMock(amount);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not set opening balance" };
  }
  revalidatePath("/cash-register");
  return { ok: true };
}

export async function addCashPaidOutAction(amount: number, note: string): Promise<ActionResult> {
  if (!note.trim()) return { ok: false, error: "A note is required for cash paid out" };
  try {
    addCashPaidOutMock(amount, note);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not log cash paid out" };
  }
  revalidatePath("/cash-register");
  return { ok: true };
}

export async function closeRegisterAction(actualAmount: number): Promise<ActionResult> {
  try {
    closeRegisterMock(actualAmount);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not close register" };
  }
  revalidatePath("/cash-register");
  return { ok: true };
}

// ---- Channel inventory (stop-sell / open-sell — see channelInventoryMock.ts) ----

export async function setStopSellAction(roomType: string, channel: string, stopSell: boolean): Promise<ActionResult> {
  try {
    setStopSellMock(roomType, channel, stopSell);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update stop-sell" };
  }
  revalidatePath("/channels");
  return { ok: true };
}

export async function setAllChannelsStopSellAction(roomTypes: string[], stopSell: boolean): Promise<ActionResult> {
  try {
    setAllChannelsStopSellMock(roomTypes, stopSell);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update all channels" };
  }
  revalidatePath("/channels");
  return { ok: true };
}

export async function setChannelStopSellAction(channel: string, roomTypes: string[], stopSell: boolean): Promise<ActionResult> {
  try {
    setChannelStopSellMock(channel, roomTypes, stopSell);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update channel" };
  }
  revalidatePath("/channels");
  return { ok: true };
}
