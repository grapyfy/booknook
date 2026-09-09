import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listBookings, createBooking } from "@/services/bookingService";
import { requireStaff } from "@/lib/require-staff";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

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
    idType: z.enum(["aadhaar", "passport", "driving_license", "voter_id", "other"]).optional(),
    idNumber: z.string().max(60).optional(),
  }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  roomNumber: z.string().min(1).max(20),
  source: z.enum(["direct", "walk-in", "phone", "other"]).optional(),
  notes: z.string().max(2000).optional(),
  initialStatus: z.enum(["confirmed", "checked-in", "waitlisted"]).optional(),
  // Pricing control — validated for shape/range here; createBooking still independently
  // clamps and recomputes `amount` server-side, this isn't the only guard.
  rateOverride: z.number().positive().max(1_000_000).optional(),
  discountAmount: z.number().min(0).max(1_000_000).optional(),
  extraServices: z.array(z.object({ name: z.string().min(1).max(120), amount: z.number().min(0).max(1_000_000) })).optional(),
  paymentStatus: z.enum(["prepaid", "postpaid", "partial"]).optional(),
  priceNote: z.string().max(500).optional(),
  groupId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  // 30 bookings/minute per staff account — generous for real front-desk use,
  // tight enough to blunt a compromised-account bulk-abuse scenario.
  const limited = await checkRateLimit(`booking_create_${auth.staff.id}`, 30, 60_000);
  if (limited) return NextResponse.json({ error: "Too many bookings created too quickly — slow down" }, { status: 429 });

  const json = await req.json();
  const parsed = createBookingSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = await createBooking(parsed.data);
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    // getActiveRoomRate throws a plain Error for "room doesn't exist" / "room inactive" —
    // both are the caller's mistake (400), not a server problem (500)
    const message = err instanceof Error ? err.message : "Could not create booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
