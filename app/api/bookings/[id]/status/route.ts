import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateBookingStatus } from "@/services/bookingService";
import { requireStaff } from "@/lib/require-staff";

const schema = z.object({
  status: z.enum(["confirmed", "checked-in", "checked-out", "cancelled", "waitlisted", "no-show"]),
});

// The lifecycle transition table lives server-side (bookingService.ALLOWED_TRANSITIONS)
// — this route enforces it, it doesn't just trust that the UI only shows legal buttons.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const booking = await updateBookingStatus(id, parsed.data.status);
    return NextResponse.json(booking);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update booking status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
