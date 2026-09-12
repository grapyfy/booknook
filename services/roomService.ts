import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Room } from "@/types/room";

type DbClient = typeof db | Prisma.TransactionClient;

function toContractShape(row: { id: string; roomNumber: string; roomType: string; ratePerNight: number; active: boolean }): Room {
  return row;
}

export async function listRooms(): Promise<Room[]> {
  const rows = await db.room.findMany({ orderBy: { roomNumber: "asc" } });
  return rows.map(toContractShape);
}

export async function createRoom(input: { roomNumber: string; roomType: string; ratePerNight: number }): Promise<Room> {
  const row = await db.room.create({ data: input });
  return toContractShape(row);
}

export async function updateRoomRate(roomNumber: string, ratePerNight: number): Promise<Room> {
  const row = await db.room.update({ where: { roomNumber }, data: { ratePerNight } });
  return toContractShape(row);
}

// Used by bookingService — throws if the room doesn't exist or is blocked (maintenance),
// so a booking can never silently get created against a room that isn't actually sellable.
// Accepts an optional transaction client so it can run inside `db.$transaction` (group
// bookings) and see uncommitted writes from earlier in the same transaction.
export async function getActiveRoomRate(roomNumber: string, client: DbClient = db): Promise<number> {
  const room = await client.room.findUnique({ where: { roomNumber } });
  if (!room) throw new Error(`Room ${roomNumber} does not exist`);
  if (!room.active) throw new Error(`Room ${roomNumber} is not active (maintenance/blocked)`);
  return room.ratePerNight;
}

// Fetches a real Room row by id — used wherever a caller only has the id (e.g. a
// HousekeepingTask/MaintenanceTicket relation), not just the roomNumber.
export async function getRoomById(id: string): Promise<Room | null> {
  const row = await db.room.findUnique({ where: { id } });
  return row ? toContractShape(row) : null;
}

// The reverse lookup — used when a caller (e.g. the maintenance ticket form) only
// has the human-friendly roomNumber but the underlying table (MaintenanceTicket)
// stores a real roomId foreign key.
export async function getRoomByNumber(roomNumber: string): Promise<Room | null> {
  const row = await db.room.findUnique({ where: { roomNumber } });
  return row ? toContractShape(row) : null;
}

// Active rooms with no CONFIRMED/CHECKED_IN booking whose date range overlaps
// [checkIn, checkOut) — same interval-overlap test and same two statuses as
// bookingService.findOverbookingConflicts, so "available" here means the same
// thing "conflict" means there. WAITLISTED bookings don't hold real inventory,
// so they don't block availability (matches existing overbooking-detection logic).
// `excludeBookingId` lets a reschedule check availability without the booking
// blocking itself.
export async function getAvailableRooms(
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<Room[]> {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const [activeRooms, overlapping] = await Promise.all([
    db.room.findMany({ where: { active: true }, orderBy: { roomNumber: "asc" } }),
    db.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { roomNumber: true },
    }),
  ]);

  const bookedRoomNumbers = new Set(overlapping.map((b) => b.roomNumber));
  return activeRooms.filter((r) => !bookedRoomNumbers.has(r.roomNumber)).map(toContractShape);
}

// Real server-side guard used by createBooking/rescheduleBooking — never rely on the
// UI having already filtered the room list, since a stale form, a race between two
// staff members, or a direct API call could all still propose an unavailable room.
export async function assertRoomAvailable(
  roomNumber: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
  client: DbClient = db
): Promise<void> {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const conflict = await client.booking.findFirst({
    where: {
      roomNumber,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkIn: { lt: end },
      checkOut: { gt: start },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    throw new Error(`Room ${roomNumber} is already booked for an overlapping date range`);
  }
}
