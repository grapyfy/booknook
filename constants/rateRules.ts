// Client-safe rate-rule enums/labels — kept separate from
// components/lib/rateRulesMock.ts because that file imports `fs`/`path` for
// its mock-store persistence, which can't be bundled into client components.
// Same split as constants/maintenance.ts and constants/payments.ts.
export const RATE_RULE_TYPES = ["WEEKLY", "DATE_RANGE"] as const;
export type RateRuleType = (typeof RATE_RULE_TYPES)[number];

export const ADJUSTMENT_TYPES = ["PERCENT", "FLAT"] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export const RATE_RULE_TYPE_LABELS: Record<RateRuleType, string> = {
  WEEKLY: "Weekly (by day)",
  DATE_RANGE: "Date range",
};

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  PERCENT: "Percent",
  FLAT: "Flat ₹",
};

// Index matches JS Date#getDay() (0=Sunday..6=Saturday) — same convention
// services/rateRuleService.ts uses for daysOfWeek.
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
