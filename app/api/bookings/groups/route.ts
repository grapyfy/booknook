import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGroupBooking } from "@/services/bookingService";

const schema = z.object({
  groupName: z.string().min(1).max(120),
  guest: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
    email: z.string().email().optional(),
  }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomNumbers: z.array(z.string().min(1).max(20)).min(2, "A group booking needs at least 2 rooms"),
  source: z.enum(["direct", "walk-in", "phone", "other"]).optional(),
});

// All-or-nothing — if any room fails (doesn't exist, inactive), none of them get
// created. See bookingService.createGroupBooking (a real Prisma transaction).
export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const bookings = await createGroupBooking(parsed.data);
    return NextResponse.json(bookings, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create group booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
