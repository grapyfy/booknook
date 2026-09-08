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
