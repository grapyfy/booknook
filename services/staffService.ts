import { db } from "@/lib/db";

export async function getStaffBySupabaseUserId(supabaseUserId: string) {
  return db.staff.findUnique({ where: { supabaseUserId } });
}

// Real provisioning stays on scripts/create-staff.js (see CLAUDE.md — no public
// signup for staff logins), so this is read-only + deactivate, not a create.
export async function listStaff() {
  return db.staff.findMany({ orderBy: { name: "asc" } });
}

// Deactivating (not deleting) revokes dashboard access while preserving whatever
// they created/assigned historically (bookings, housekeeping tasks, etc. keep a
// valid reference instead of orphaning).
export async function setStaffActive(id: string, active: boolean) {
  return db.staff.update({ where: { id }, data: { active } });
}
