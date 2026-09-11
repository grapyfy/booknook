import { db } from "@/lib/db";
import type { Booking } from "@/types/booking";
import { BOOKING_INCLUDE, bookingToContractShape } from "@/services/bookingService";

// There's no stable guest identity across bookings yet (each booking creates its own
// Guest row) — phone number is the matching key for "this guest's history," same
// approach as the UI branch's mock layer. Worth a real Guest-dedup pass if that becomes
// a requirement (a returning guest currently looks like N separate guests).
export async function getBookingsByGuestPhone(phone: string): Promise<Booking[]> {
  const rows = await db.booking.findMany({
    where: { guest: { phone } },
    include: BOOKING_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(bookingToContractShape);
}
