import { db } from "@/lib/db";
import { BOOKING_INCLUDE, bookingToContractShape } from "./bookingService";
import { Prisma } from "@prisma/client";

type BookingWithGuest = Prisma.BookingGetPayload<{
  include: typeof BOOKING_INCLUDE;
}>;

export async function getDashboardStats() {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const startOf7d = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
  const startOf14d = new Date(fourteenDaysAgo.getFullYear(), fourteenDaysAgo.getMonth(), fourteenDaysAgo.getDate());

  // Current 7-day bookings
  const bookings7d = await db.booking.findMany({
    where: {
      createdAt: { gte: startOf7d, lt: endOfToday },
      status: { not: "CANCELLED" },
    },
    include: BOOKING_INCLUDE,
  });

  // Previous 7-day bookings (for delta calc)
  const bookings14d = await db.booking.findMany({
    where: {
      createdAt: { gte: startOf14d, lt: startOf7d },
      status: { not: "CANCELLED" },
    },
    include: BOOKING_INCLUDE,
  });

  // Bookings with check-in today (arrivals)
  const arrivalsDataRaw = await db.booking.findMany({
    where: {
      checkIn: {
        gte: startOfToday,
        lt: endOfToday,
      },
      status: { in: ["CONFIRMED", "WAITLISTED"] },
    },
    include: BOOKING_INCLUDE,
  });
  const arrivalsToday = arrivalsDataRaw.map(b => ({
    ...b,
    status: b.status.toLowerCase() as "confirmed" | "checked-in" | "checked-out" | "cancelled" | "waitlisted" | "no-show",
  })) as unknown as BookingWithGuest[];

  // Bookings with check-out today (departures)
  const departuresDataRaw = await db.booking.findMany({
    where: {
      checkOut: {
        gte: startOfToday,
        lt: endOfToday,
      },
      status: { not: "CANCELLED" },
    },
    include: BOOKING_INCLUDE,
  });
  const departurestoday = departuresDataRaw.map(b => ({
    ...b,
    status: b.status.toLowerCase() as "confirmed" | "checked-in" | "checked-out" | "cancelled" | "waitlisted" | "no-show",
  })) as unknown as BookingWithGuest[];

  // All rooms (for status breakdown)
  const allRooms = await db.room.findMany();
  const activeRooms = allRooms.filter(r => r.active);

  // Current occupancy
  const checkedInNow = await db.booking.findMany({
    where: {
      status: "CHECKED_IN",
      checkIn: { lte: today },
      checkOut: { gt: today },
    },
  });

  // Room status breakdown
  const maintenanceCount = allRooms.filter(r => !r.active).length;
  const allRoomsByStatus = {
    occupied: checkedInNow.length,
    available: activeRooms.length - checkedInNow.length,
    maintenance: maintenanceCount,
  };

  // Compute stats
  const totalBookings = bookings7d.length;
  const totalBookingsPrev = bookings14d.slice(7).length; // Previous 7 days
  const totalBookingsDeltaPct = totalBookingsPrev === 0
    ? (totalBookings > 0 ? 100 : 0)
    : Math.round(((totalBookings - totalBookingsPrev) / totalBookingsPrev) * 100);

  const totalRevenue = bookings7d.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalRevenuePrev = bookings14d.slice(7).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalRevenueDeltaPct = totalRevenuePrev === 0
    ? (totalRevenue > 0 ? 100 : 0)
    : Math.round(((totalRevenue - totalRevenuePrev) / totalRevenuePrev) * 100);

  const uniqueGuestsSet = new Set(bookings7d.map(b => b.guestId));
  const totalGuests = uniqueGuestsSet.size;
  const uniqueGuestsPrevSet = new Set(bookings14d.slice(7).map(b => b.guestId));
  const totalGuestsPrev = uniqueGuestsPrevSet.size;
  const totalGuestsDeltaPct = totalGuestsPrev === 0
    ? (totalGuests > 0 ? 100 : 0)
    : Math.round(((totalGuests - totalGuestsPrev) / totalGuestsPrev) * 100);

  // Recent bookings
  const recentBookingsRaw = await db.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    include: BOOKING_INCLUDE,
  });
  const recentBookings = recentBookingsRaw.map(b => ({
    ...b,
    status: b.status.toLowerCase() as "confirmed" | "checked-in" | "checked-out" | "cancelled" | "waitlisted" | "no-show",
  })) as unknown as BookingWithGuest[];

  const occupancyRate = activeRooms.length > 0
    ? Math.round((checkedInNow.length / activeRooms.length) * 100)
    : 0;

  const adr = totalBookings > 0
    ? Math.round(totalRevenue / totalBookings)
    : 0;

  const roomNightsAvailable = activeRooms.length * 7; // 7 days
  const revPAR = roomNightsAvailable > 0
    ? Math.round(totalRevenue / roomNightsAvailable)
    : 0;

  // Revenue by day (last 7 days)
  const revenueByDay: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayRevenue = bookings7d
      .filter(b => b.createdAt >= dayStart && b.createdAt < dayEnd)
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    revenueByDay.push({
      date: dayStart.toISOString().split("T")[0],
      amount: dayRevenue,
    });
  }

  return {
    totalBookings,
    totalBookingsDeltaPct,
    totalRevenue,
    totalRevenueDeltaPct,
    totalGuests,
    totalGuestsDeltaPct,
    occupancyRate,
    activeRoomCount: activeRooms.length,
    adr,
    revPAR,
    revenueByDay,
    roomStatus: allRoomsByStatus,
    arrivalsToday,
    departuresToday: departurestoday,
    recentBookings,
  };
}
