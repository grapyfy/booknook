import { db } from "@/lib/db";
import type { Room } from "@/types/room";

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
export async function getActiveRoomRate(roomNumber: string): Promise<number> {
  const room = await db.room.findUnique({ where: { roomNumber } });
  if (!room) throw new Error(`Room ${roomNumber} does not exist`);
  if (!room.active) throw new Error(`Room ${roomNumber} is not active (maintenance/blocked)`);
  return room.ratePerNight;
}
