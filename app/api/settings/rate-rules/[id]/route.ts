import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateRateRule, deleteRateRule } from "@/services/rateRuleService";
import { requireOwner } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  active: z.boolean().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  adjustmentType: z.enum(["PERCENT", "FLAT"]).optional(),
  adjustmentValue: z.number().int().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const rule = await updateRateRule(id, parsed.data);
    await logAction({ staffId: auth.staff.id, action: "rate_rule.update", entityType: "RateRule", entityId: id, details: parsed.data });
    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Rate rule not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    await deleteRateRule(id);
    await logAction({ staffId: auth.staff.id, action: "rate_rule.delete", entityType: "RateRule", entityId: id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Rate rule not found" }, { status: 404 });
  }
}
