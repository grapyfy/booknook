import { db } from "@/lib/db";

export async function getStaffBySupabaseUserId(supabaseUserId: string) {
  return db.staff.findUnique({ where: { supabaseUserId } });
}
