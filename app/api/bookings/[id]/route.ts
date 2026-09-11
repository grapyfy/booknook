import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBooking, rescheduleBooking } from "@/services/bookingService";
import { requireStaff } from "@/lib/require-staff";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json(booking);
}

const rescheduleSchema = z.object({
  roomNumber: z.string().min(1).max(20).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Covers extend/shorten stay, move room, and calendar drag-and-drop — all the same
// operation underneath. See bookingService.rescheduleBooking.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = rescheduleSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const booking = await rescheduleBooking(id, parsed.data);
    return NextResponse.json(booking);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reschedule booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
