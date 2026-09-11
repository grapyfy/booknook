import { NextResponse } from "next/server";
import { listStaff } from "@/services/staffService";
import { requireStaff } from "@/lib/require-staff";

// Read-only — real staff provisioning stays on scripts/create-staff.js (no public
// signup for staff logins, per CLAUDE.md). Any logged-in staff member can see the
// directory (needed for housekeeping/maintenance "assign to" dropdowns) — managing
// it (deactivating someone) is owner-only, see [id]/route.ts.
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  return NextResponse.json(await listStaff());
}
