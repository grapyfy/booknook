import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPropertySettings, updatePropertySettings } from "@/services/settingsService";
import { requireStaff, requireOwner } from "@/lib/require-staff";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  return NextResponse.json(await getPropertySettings());
}

const schema = z.object({
  hotelName: z.string().min(1).max(160),
  address: z.string().min(1).max(500),
  gstNumber: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
});

// Property/GST details — OWNER only, not every front-desk login.
export async function PATCH(req: NextRequest) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await updatePropertySettings(parsed.data);
  return NextResponse.json(settings);
}
