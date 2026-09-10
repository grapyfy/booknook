import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableRooms } from "@/services/roomService";
import { requireStaff } from "@/lib/require-staff";

const querySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  excludeBookingId: z.string().uuid().optional(),
});

// Client-side forms (New Booking, Walk-in, Reschedule) call this as the user
// picks dates, so they see which rooms are actually free before submitting —
// createBooking/rescheduleBooking still independently re-check server-side
// (see bookingService), this endpoint is for showing the user real information,
// not the only guard against double-booking.
export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    checkIn: searchParams.get("checkIn"),
    checkOut: searchParams.get("checkOut"),
    excludeBookingId: searchParams.get("excludeBookingId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rooms = await getAvailableRooms(parsed.data.checkIn, parsed.data.checkOut, parsed.data.excludeBookingId);
  return NextResponse.json(rooms);
}
