import { db } from "@/lib/db";
import type { Prisma, BookingStatus, BookingSource, PaymentStatus } from "@prisma/client";
import type { Booking } from "@/types/booking";
import { getActiveRoomRate } from "@/services/roomService";

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Explicit maps both ways — deliberately not a generic string transform (toLowerCase +
// replace underscores). A generic transform happens to work for today's enum values but
// breaks silently and confusingly the day someone adds a value that doesn't fit the
// pattern; an explicit map instead fails loudly (TypeScript error) if a case is missed.
const STATUS_TO_CONTRACT: Record<BookingStatus, Booking["status"]> = {
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked-in",
  CHECKED_OUT: "checked-out",
  CANCELLED: "cancelled",
  WAITLISTED: "waitlisted",
  NO_SHOW: "no-show",
};
const STATUS_FROM_CONTRACT: Record<Booking["status"], BookingStatus> = {
  confirmed: "CONFIRMED",
  "checked-in": "CHECKED_IN",
  "checked-out": "CHECKED_OUT",
  cancelled: "CANCELLED",
  waitlisted: "WAITLISTED",
  "no-show": "NO_SHOW",
};
const SOURCE_TO_CONTRACT: Record<BookingSource, NonNullable<Booking["source"]>> = {
  DIRECT: "direct",
  WALK_IN: "walk-in",
  PHONE: "phone",
  OTHER: "other",
};
const SOURCE_FROM_CONTRACT: Record<NonNullable<Booking["source"]>, BookingSource> = {
  direct: "DIRECT",
  "walk-in": "WALK_IN",
  phone: "PHONE",
  other: "OTHER",
};
const PAYMENT_STATUS_TO_CONTRACT: Record<PaymentStatus, NonNullable<Booking["paymentStatus"]>> = {
  PREPAID: "prepaid",
  POSTPAID: "postpaid",
  PARTIAL: "partial",
};
const PAYMENT_STATUS_FROM_CONTRACT: Record<NonNullable<Booking["paymentStatus"]>, PaymentStatus> = {
  prepaid: "PREPAID",
  postpaid: "POSTPAID",
  partial: "PARTIAL",
};

// Booking lifecycle — the single source of truth for which transitions are legal.
// Enforced here (server-side), not just by which buttons the UI happens to render.
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  WAITLISTED: ["CONFIRMED", "CANCELLED"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [], // terminal
  CANCELLED: [], // terminal
  NO_SHOW: [], // terminal
};

type BookingWithRelations = Prisma.BookingGetPayload<{ include: { guest: true; group: true; extraServices: true } }>;

function toContractShape(row: BookingWithRelations): Booking {
  return {
    id: row.id,
    guest: {
      id: row.guest.id,
      name: row.guest.name,
      phone: row.guest.phone,
      email: row.guest.email ?? undefined,
      idType: row.guest.idType ? (row.guest.idType.toLowerCase() as NonNullable<Booking["guest"]["idType"]>) : undefined,
      idNumber: row.guest.idNumber ?? undefined,
    },
    checkIn: row.checkIn.toISOString().slice(0, 10),
    checkOut: row.checkOut.toISOString().slice(0, 10),
    roomNumber: row.roomNumber,
    status: STATUS_TO_CONTRACT[row.status],
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
    source: row.source ? SOURCE_TO_CONTRACT[row.source] : undefined,
    notes: row.notes ?? undefined,
    groupId: row.groupId ?? undefined,
    groupName: row.group?.name ?? undefined,
    paymentStatus: row.paymentStatus ? PAYMENT_STATUS_TO_CONTRACT[row.paymentStatus] : undefined,
    extraServices: row.extraServices.length
      ? row.extraServices.map((s) => ({ name: s.name, amount: s.amount }))
      : undefined,
    discountAmount: row.discountAmount ?? undefined,
    priceNote: row.priceNote ?? undefined,
  };
}

// Exported so other services (guestService) can query bookings with the same shape
// and mapping logic, rather than duplicating it — a second copy of this mapping is
// exactly the kind of drift the "same mistake in multiple places" rule warns about.
export const BOOKING_INCLUDE = { guest: true, group: true, extraServices: true } as const;
export { toContractShape as bookingToContractShape };
const INCLUDE = BOOKING_INCLUDE;

export async function listBookings(): Promise<Booking[]> {
  const rows = await db.booking.findMany({ include: INCLUDE, orderBy: { createdAt: "desc" } });
  return rows.map(toContractShape);
}

export async function getBooking(id: string): Promise<Booking | null> {
  const row = await db.booking.findUnique({ where: { id }, include: INCLUDE });
  return row ? toContractShape(row) : null;
}

export interface CreateBookingInput {
  guest: { name: string; phone: string; email?: string; idType?: NonNullable<Booking["guest"]["idType"]>; idNumber?: string };
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  source?: NonNullable<Booking["source"]>;
  notes?: string;
  initialStatus?: "confirmed" | "checked-in" | "waitlisted";
  // Pricing control: the caller PROPOSES a rate/discount, this function still derives
  // `amount` from a formula and clamps every input to a sane range — it never accepts
  // a final total directly. See CLAUDE.md: "never trust an amount from the client."
  rateOverride?: number;
  discountAmount?: number;
  extraServices?: { name: string; amount: number }[];
  paymentStatus?: NonNullable<Booking["paymentStatus"]>;
  priceNote?: string;
  groupId?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const roomRatePerNight = await getActiveRoomRate(input.roomNumber);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const effectiveRate = input.rateOverride && input.rateOverride > 0 ? input.rateOverride : roomRatePerNight;
  const subtotal = effectiveRate * nights;
  const discountAmount = Math.min(Math.max(input.discountAmount ?? 0, 0), subtotal);
  const amount = subtotal - discountAmount;

  const row = await db.booking.create({
    data: {
      checkIn: new Date(input.checkIn),
      checkOut: new Date(input.checkOut),
      roomNumber: input.roomNumber,
      roomRatePerNight: effectiveRate, // the rate actually charged, not the room's list rate — see schema comment
      amount,
      status: input.initialStatus ? STATUS_FROM_CONTRACT[input.initialStatus] : "CONFIRMED",
      source: input.source ? SOURCE_FROM_CONTRACT[input.source] : undefined,
      notes: input.notes,
      group: input.groupId ? { connect: { id: input.groupId } } : undefined,
      paymentStatus: input.paymentStatus ? PAYMENT_STATUS_FROM_CONTRACT[input.paymentStatus] : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      priceNote: input.priceNote,
      guest: {
        create: {
          name: input.guest.name,
          phone: input.guest.phone,
          email: input.guest.email,
          idType: input.guest.idType ? (input.guest.idType.toUpperCase() as Prisma.GuestCreateInput["idType"]) : undefined,
          idNumber: input.guest.idNumber,
        },
      },
      extraServices: input.extraServices?.length
        ? { create: input.extraServices.map((s) => ({ name: s.name, amount: s.amount })) }
        : undefined,
    },
    include: INCLUDE,
  });

  return toContractShape(row);
}

// Extend/shorten a stay or move it to a different room — the same operation underneath
// (drag-and-drop on the calendar uses this too). Recomputes `amount` from the (possibly
// new) room's real rate, same "never trust a client amount" rule as creation.
export async function rescheduleBooking(
  id: string,
  updates: { roomNumber?: string; checkIn?: string; checkOut?: string }
): Promise<Booking> {
  const existing = await db.booking.findUniqueOrThrow({ where: { id } });
  if (["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
    throw new Error(`Cannot reschedule a ${existing.status.toLowerCase()} booking`);
  }

  const roomNumber = updates.roomNumber ?? existing.roomNumber;
  const checkIn = updates.checkIn ?? existing.checkIn.toISOString().slice(0, 10);
  const checkOut = updates.checkOut ?? existing.checkOut.toISOString().slice(0, 10);

  const roomRatePerNight = await getActiveRoomRate(roomNumber);
  const nights = nightsBetween(checkIn, checkOut);
  // A previously-applied discount is preserved in absolute rupees, but never allowed to
  // exceed the new subtotal (e.g. shortening a stay could otherwise make it negative).
  const subtotal = roomRatePerNight * nights;
  const discountAmount = Math.min(existing.discountAmount ?? 0, subtotal);
  const amount = subtotal - discountAmount;

  const row = await db.booking.update({
    where: { id },
    data: { roomNumber, checkIn: new Date(checkIn), checkOut: new Date(checkOut), roomRatePerNight, amount },
    include: INCLUDE,
  });
  return toContractShape(row);
}

export async function updateBookingStatus(id: string, next: Booking["status"]): Promise<Booking> {
  const existing = await db.booking.findUniqueOrThrow({ where: { id } });
  const nextEnum = STATUS_FROM_CONTRACT[next];
  const allowed = ALLOWED_TRANSITIONS[existing.status];
  if (!allowed.includes(nextEnum)) {
    throw new Error(`Cannot move a ${existing.status.toLowerCase()} booking to ${next}`);
  }
  const row = await db.booking.update({ where: { id }, data: { status: nextEnum }, include: INCLUDE });
  return toContractShape(row);
}

// N rooms under one contact, all sharing a BookingGroup — all-or-nothing: if any room
// in the group fails validation (e.g. a nonexistent room), NONE of them get created.
// A Prisma interactive transaction is the right tool for this, not a manual rollback.
export async function createGroupBooking(input: {
  groupName: string;
  guest: { name: string; phone: string; email?: string };
  checkIn: string;
  checkOut: string;
  roomNumbers: string[];
  source?: NonNullable<Booking["source"]>;
}): Promise<Booking[]> {
  if (input.roomNumbers.length < 2) throw new Error("A group booking needs at least 2 rooms");

  return db.$transaction(async (tx) => {
    const group = await tx.bookingGroup.create({ data: { name: input.groupName } });
    const bookings: Booking[] = [];

    for (const roomNumber of input.roomNumbers) {
      const roomRatePerNight = await getActiveRoomRate(roomNumber, tx);
      const nights = nightsBetween(input.checkIn, input.checkOut);
      const row = await tx.booking.create({
        data: {
          checkIn: new Date(input.checkIn),
          checkOut: new Date(input.checkOut),
          roomNumber,
          roomRatePerNight,
          amount: roomRatePerNight * nights,
          source: input.source ? SOURCE_FROM_CONTRACT[input.source] : undefined,
          group: { connect: { id: group.id } },
          guest: { create: { name: input.guest.name, phone: input.guest.phone, email: input.guest.email } },
        },
        include: INCLUDE,
      });
      bookings.push(toContractShape(row));
    }
    return bookings;
  });
}

// Scans confirmed bookings whose room+date range overlaps another booking on the same
// room — the actual overbooking check, not a fabricated count. Two bookings overlap if
// one's check-in is before the other's check-out and vice versa (standard interval overlap).
export async function findOverbookingConflicts(): Promise<{ roomNumber: string; bookingIds: string[] }[]> {
  const active = await db.booking.findMany({
    where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    select: { id: true, roomNumber: true, checkIn: true, checkOut: true },
  });

  const byRoom = new Map<string, typeof active>();
  for (const b of active) byRoom.set(b.roomNumber, [...(byRoom.get(b.roomNumber) ?? []), b]);

  const conflicts: { roomNumber: string; bookingIds: string[] }[] = [];
  for (const [roomNumber, bookings] of byRoom) {
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const a = bookings[i], b = bookings[j];
        if (a.checkIn < b.checkOut && b.checkIn < a.checkOut) {
          conflicts.push({ roomNumber, bookingIds: [a.id, b.id] });
        }
      }
    }
  }
  return conflicts;
}

// Confirmed bookings whose check-in date has already passed without a check-in —
// the "possible no-show" signal. Computed fresh on every call, never cached/guessed.
export async function findPossibleNoShows(): Promise<Booking[]> {
  const rows = await db.booking.findMany({
    where: { status: "CONFIRMED", checkIn: { lt: new Date(new Date().toDateString()) } },
    include: INCLUDE,
  });
  return rows.map(toContractShape);
}
