import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listBookings, createBooking } from "@/services/bookingService";

export async function GET() {
  const bookings = await listBookings();
  return NextResponse.json(bookings);
}

// Every field is validated before it touches the database or business logic —
// this is what actually stops SQL injection / malformed-data bugs, not just "trusting" input.
const createBookingSchema = z.object({
  guest: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
    email: z.string().email().optional(),
  }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  roomNumber: z.string().min(1).max(20),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createBookingSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await createBooking(parsed.data);
  return NextResponse.json(booking, { status: 201 });
}
