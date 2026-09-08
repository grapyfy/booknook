// Client-safe maintenance category/priority data — kept separate from
// components/lib/maintenanceMock.ts because that file imports `fs`/`path`
// for its mock-store persistence, which can't be bundled into client
// components. Anything imported here as a *value* (not just `import type`)
// from a "use client" component must live in a module with zero server-only
// imports, or the whole dependency chain breaks the client bundle — see
// STATUS.md's part-14 entry for the build failure this caused before the split.
export const MAINTENANCE_CATEGORIES = ["electrical", "plumbing", "ac", "furniture", "bathroom", "internet", "appliance", "other"] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const MAINTENANCE_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

// Single source of truth for the category display label — was previously
// declared identically in both MaintenanceTicketCard.tsx and
// MaintenanceTicketForm.tsx, a real drift risk per RULES.md's "no hardcoded,
// single source of truth" rule (changing one wouldn't have changed the other).
export const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  ac: "AC",
  furniture: "Furniture",
  bathroom: "Bathroom",
  internet: "Internet",
  appliance: "Appliance",
  other: "Other",
};
