import { db } from "@/lib/db";
import type { RateRuleType, RateAdjustmentType } from "@prisma/client";

export interface RateRule {
  id: string;
  name: string;
  type: RateRuleType;
  daysOfWeek: number[];
  startDate: string | null;
  endDate: string | null;
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number;
  active: boolean;
  priority: number;
}

function toContractShape(row: {
  id: string;
  name: string;
  type: RateRuleType;
  daysOfWeek: number[];
  startDate: Date | null;
  endDate: Date | null;
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number;
  active: boolean;
  priority: number;
}): RateRule {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    daysOfWeek: row.daysOfWeek,
    startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
    endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
    adjustmentType: row.adjustmentType,
    adjustmentValue: row.adjustmentValue,
    active: row.active,
    priority: row.priority,
  };
}

export async function listRateRules(): Promise<RateRule[]> {
  const rows = await db.rateRule.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "asc" }] });
  return rows.map(toContractShape);
}

export async function createRateRule(input: {
  name: string;
  type: RateRuleType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string;
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number;
  priority?: number;
}): Promise<RateRule> {
  const row = await db.rateRule.create({
    data: {
      name: input.name,
      type: input.type,
      daysOfWeek: input.type === "WEEKLY" ? (input.daysOfWeek ?? []) : [],
      startDate: input.type === "DATE_RANGE" && input.startDate ? new Date(input.startDate) : null,
      endDate: input.type === "DATE_RANGE" && input.endDate ? new Date(input.endDate) : null,
      adjustmentType: input.adjustmentType,
      adjustmentValue: input.adjustmentValue,
      priority: input.priority ?? 0,
    },
  });
  return toContractShape(row);
}

export async function updateRateRule(
  id: string,
  input: Partial<{
    name: string;
    active: boolean;
    daysOfWeek: number[];
    startDate: string | null;
    endDate: string | null;
    adjustmentType: RateAdjustmentType;
    adjustmentValue: number;
    priority: number;
  }>
): Promise<RateRule> {
  const row = await db.rateRule.update({
    where: { id },
    data: {
      ...input,
      startDate: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : undefined,
      endDate: input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : undefined,
    },
  });
  return toContractShape(row);
}

export async function deleteRateRule(id: string): Promise<void> {
  await db.rateRule.delete({ where: { id } });
}

// Highest-priority ACTIVE rule matching this specific calendar date — WEEKLY rules
// match by day-of-week (0=Sunday..6=Saturday, same convention as JS Date#getDay()),
// DATE_RANGE rules match an inclusive [startDate, endDate] window. Only one rule
// ever applies per night (the highest priority match), rules are never stacked —
// e.g. a named festival-week rule should be given higher priority than a generic
// weekly weekend rule so it wins outright on an overlapping date, not add to it.
async function findApplicableRule(date: Date) {
  const dayOfWeek = date.getDay();
  const rules = await db.rateRule.findMany({
    where: { active: true },
    orderBy: { priority: "desc" },
  });
  return rules.find((r) => {
    if (r.type === "WEEKLY") return r.daysOfWeek.includes(dayOfWeek);
    if (r.type === "DATE_RANGE" && r.startDate && r.endDate) {
      return date >= r.startDate && date <= r.endDate;
    }
    return false;
  });
}

function applyAdjustment(baseRate: number, rule: { adjustmentType: RateAdjustmentType; adjustmentValue: number }): number {
  return rule.adjustmentType === "PERCENT"
    ? Math.round(baseRate * (1 + rule.adjustmentValue / 100))
    : baseRate + rule.adjustmentValue;
}

// Sums each individual night's rate (after any matching rule's adjustment) rather
// than one flat rate × nights — a stay spanning e.g. a weekday into a weekend
// shouldn't be priced as if every night were the same. Returns both the total
// (for `amount`) and an average per-night rate (stored as `roomRatePerNight`,
// used for the GST slab and folio display) — a stay with genuinely mixed nightly
// rates doesn't have one single "the" rate, and averaging is the same level of
// approximation the rest of v1 operates at (see BACKEND_LOGIC.md's other
// deferred-precision notes, e.g. IGST). Revisit if a hotel ever needs true
// per-night GST slab splitting on one folio.
export async function computeNightlyPricing(
  baseRatePerNight: number,
  checkIn: string,
  checkOut: string
): Promise<{ subtotal: number; averageRatePerNight: number; nights: number }> {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let subtotal = 0;
  let nights = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const rule = await findApplicableRule(d);
    subtotal += rule ? applyAdjustment(baseRatePerNight, rule) : baseRatePerNight;
    nights += 1;
  }
  nights = Math.max(1, nights); // same-day edge case, matches existing nightsBetween behavior elsewhere
  return { subtotal, averageRatePerNight: Math.round(subtotal / nights), nights };
}
