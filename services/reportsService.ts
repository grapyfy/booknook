import { db } from "@/lib/db";

export interface OccupancyReport {
  rangeStart: string;
  rangeEnd: string;
  totalActiveRooms: number;
  roomNightsAvailable: number; // totalActiveRooms * number of days in range
  roomNightsSold: number; // sum of nights actually booked (non-cancelled) within the range
  occupancyRate: number; // roomNightsSold / roomNightsAvailable, as a percentage
  roomRevenue: number; // sum of `amount` for non-cancelled bookings overlapping the range
  adr: number; // Average Daily Rate = roomRevenue / roomNightsSold (0 if nothing sold)
  revPAR: number; // Revenue Per Available Room = roomRevenue / roomNightsAvailable
  revenueByRoom: { roomNumber: string; revenue: number }[];
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

// Clips a booking's [checkIn, checkOut) range to the report's [rangeStart, rangeEnd)
// window — a booking that only partially overlaps the range should only contribute
// the nights that actually fall inside it, not its full length.
function overlapNights(bookingStart: Date, bookingEnd: Date, rangeStart: Date, rangeEnd: Date): number {
  const start = bookingStart > rangeStart ? bookingStart : rangeStart;
  const end = bookingEnd < rangeEnd ? bookingEnd : rangeEnd;
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
}

export async function getOccupancyReport(rangeStart: Date, rangeEnd: Date): Promise<OccupancyReport> {
  const [totalActiveRooms, bookings] = await Promise.all([
    db.room.count({ where: { active: true } }),
    db.booking.findMany({
      where: {
        status: { notIn: ["CANCELLED"] },
        checkIn: { lt: rangeEnd },
        checkOut: { gt: rangeStart },
      },
      select: { roomNumber: true, checkIn: true, checkOut: true, amount: true },
    }),
  ]);

  const days = daysBetween(rangeStart, rangeEnd);
  const roomNightsAvailable = totalActiveRooms * days;

  let roomNightsSold = 0;
  let roomRevenue = 0;
  const revenueByRoomMap = new Map<string, number>();

  for (const b of bookings) {
    const nights = overlapNights(b.checkIn, b.checkOut, rangeStart, rangeEnd);
    roomNightsSold += nights;
    // Revenue is attributed proportionally to the nights that actually fall in range,
    // not the booking's full amount — a booking spanning outside the range shouldn't
    // inflate this window's revenue.
    const totalNights = daysBetween(b.checkIn, b.checkOut);
    const attributedRevenue = totalNights > 0 ? Math.round((b.amount * nights) / totalNights) : 0;
    roomRevenue += attributedRevenue;
    revenueByRoomMap.set(b.roomNumber, (revenueByRoomMap.get(b.roomNumber) ?? 0) + attributedRevenue);
  }

  return {
    rangeStart: rangeStart.toISOString().slice(0, 10),
    rangeEnd: rangeEnd.toISOString().slice(0, 10),
    totalActiveRooms,
    roomNightsAvailable,
    roomNightsSold,
    occupancyRate: roomNightsAvailable > 0 ? Math.round((roomNightsSold / roomNightsAvailable) * 100) : 0,
    roomRevenue,
    adr: roomNightsSold > 0 ? Math.round(roomRevenue / roomNightsSold) : 0,
    revPAR: roomNightsAvailable > 0 ? Math.round(roomRevenue / roomNightsAvailable) : 0,
    revenueByRoom: Array.from(revenueByRoomMap.entries())
      .map(([roomNumber, revenue]) => ({ roomNumber, revenue }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
