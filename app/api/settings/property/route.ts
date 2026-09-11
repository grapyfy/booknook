import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPropertySettings, updatePropertySettings } from "@/services/settingsService";
import { requireStaff, requireOwner } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

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
  // Government-notified GST slab (CBIC), not a business choice — see the schema
  // comment on PropertySettings. Bounded to sane ranges (a % over 100 or a
  // negative threshold is never legitimate) but the real backstop against
  // typing in an arbitrary "business decision" rate is process, not validation:
  // only update these when the actual law changes.
  gstThresholdRupees: z.number().int().positive().max(1000000).optional(),
  gstLowRatePercent: z.number().int().min(0).max(100).optional(),
  gstHighRatePercent: z.number().int().min(0).max(100).optional(),
});

// Property/GST details — OWNER only, not every front-desk login.
export async function PATCH(req: NextRequest) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await updatePropertySettings(parsed.data);
  if (parsed.data.gstThresholdRupees !== undefined || parsed.data.gstLowRatePercent !== undefined || parsed.data.gstHighRatePercent !== undefined) {
    await logAction({
      staffId: auth.staff.id,
      action: "settings.gst_config_change",
      entityType: "PropertySettings",
      entityId: settings.id,
      details: {
        gstThresholdRupees: settings.gstThresholdRupees,
        gstLowRatePercent: settings.gstLowRatePercent,
        gstHighRatePercent: settings.gstHighRatePercent,
      },
    });
  }
  return NextResponse.json(settings);
}
