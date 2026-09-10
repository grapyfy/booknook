import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listRateRules, createRateRule } from "@/services/rateRuleService";
import { requireStaff, requireOwner } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

// Any active staff can view the rules that are already in effect on bookings.
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  return NextResponse.json(await listRateRules());
}

const schema = z
  .object({
    name: z.string().min(1).max(120),
    type: z.enum(["WEEKLY", "DATE_RANGE"]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    adjustmentType: z.enum(["PERCENT", "FLAT"]),
    adjustmentValue: z.number().int(),
    priority: z.number().int().min(0).max(1000).optional(),
  })
  .refine((v) => v.type !== "WEEKLY" || (v.daysOfWeek && v.daysOfWeek.length > 0), {
    message: "A weekly rule needs at least one day of the week",
    path: ["daysOfWeek"],
  })
  .refine((v) => v.type !== "DATE_RANGE" || (v.startDate && v.endDate && v.startDate <= v.endDate), {
    message: "A date-range rule needs a valid start/end date",
    path: ["startDate"],
  })
  .refine((v) => v.adjustmentType !== "PERCENT" || (v.adjustmentValue >= -90 && v.adjustmentValue <= 500), {
    message: "Percent adjustment must be between -90 and 500",
    path: ["adjustmentValue"],
  });

// Pricing rules are OWNER-only — this changes what every future guest is charged,
// not a front-desk-in-the-moment decision like a booking's rate override.
export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const rule = await createRateRule(parsed.data);
  await logAction({ staffId: auth.staff.id, action: "rate_rule.create", entityType: "RateRule", entityId: rule.id, details: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
