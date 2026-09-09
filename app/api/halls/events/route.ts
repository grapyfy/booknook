import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listHallEvents, createHallEvent } from "@/services/hallService";
import { requireStaff } from "@/lib/require-staff";

export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const hallId = req.nextUrl.searchParams.get("hallId") ?? undefined;
  return NextResponse.json(await listHallEvents(hallId));
}

const schema = z.object({
  hallId: z.string().uuid(),
  eventName: z.string().min(1).max(160),
  contactName: z.string().min(1).max(120),
  contactPhone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  startsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  endsAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
});

// Overlap-checked server-side (hallService) — two events can't share a hall for
// intersecting time ranges, same principle as room overbooking detection.
export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const event = await createHallEvent(parsed.data);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create hall event";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
