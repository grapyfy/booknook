import { db } from "@/lib/db";
import type { Booking } from "@/types/booking";
import { getActiveRoomRate } from "@/services/roomService";

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function toContractShape(row: Awaited<ReturnType<typeof db.booking.findFirstOrThrow>>): Booking {
  return {
    id: row.id,
    guest: { id: row.guestId, name: (row as any).guest?.name ?? "", phone: (row as any).guest?.phone ?? "" },
    checkIn: row.checkIn.toISOString().slice(0, 10),
    checkOut: row.checkOut.toISOString().slice(0, 10),
    roomNumber: row.roomNumber,
    status: row.status.toLowerCase().replace("_", "-") as Booking["status"],
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBookings(): Promise<Booking[]> {
  const rows = await db.booking.findMany({
    include: { guest: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toContractShape);
}

// The room's rate is looked up server-side by roomNumber — the amount is never
// accepted from whoever calls this. See CLAUDE.md: "Never trust an amount from the client."
export async function createBooking(input: {
  guest: { name: string; phone: string; email?: string };
  checkIn: string;
  checkOut: string;
  roomNumber: string;
}): Promise<Booking> {
  const roomRatePerNight = await getActiveRoomRate(input.roomNumber);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const amount = roomRatePerNight * nights;

  const row = await db.booking.create({
    data: {
      checkIn: new Date(input.checkIn),
      checkOut: new Date(input.checkOut),
      roomNumber: input.roomNumber,
      roomRatePerNight,
      amount,
      guest: {
        create: { name: input.guest.name, phone: input.guest.phone, email: input.guest.email },
      },
    },
    include: { guest: true },
  });

  return toContractShape(row);
}
