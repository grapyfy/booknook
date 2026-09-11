import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setStaffActive } from "@/services/staffService";
import { requireOwner } from "@/lib/require-staff";

const schema = z.object({ active: z.boolean() });

// Deactivate/reactivate — not a delete, so their historical work (bookings created,
// tasks assigned) keeps a valid reference. See staffService.setStaffActive.
// OWNER only — a staffer shouldn't be able to deactivate colleagues (or reactivate themselves).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const staff = await setStaffActive(id, parsed.data.active);
  return NextResponse.json(staff);
}
