import { db } from "@/lib/db";

// Enforced as a singleton in application code (always operate on the first/only row),
// not at the schema level — Postgres has no clean native "at most one row" constraint
// worth the complexity for a v1 that's one property, not a chain.
export async function getPropertySettings() {
  const existing = await db.propertySettings.findFirst();
  if (existing) return existing;
  // No row yet — create a blank one rather than returning null, so the Settings
  // screen always has something real to render/edit instead of a special "not set up" state.
  return db.propertySettings.create({ data: { hotelName: "", address: "" } });
}

export async function updatePropertySettings(input: { hotelName: string; address: string; gstNumber?: string; phone?: string }) {
  const existing = await getPropertySettings();
  return db.propertySettings.update({ where: { id: existing.id }, data: input });
}
