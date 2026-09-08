import { NextResponse } from "next/server";
import { listStaff } from "@/services/staffService";

// Read-only — real staff provisioning stays on scripts/create-staff.js (no public
// signup for staff logins, per CLAUDE.md).
export async function GET() {
  return NextResponse.json(await listStaff());
}
