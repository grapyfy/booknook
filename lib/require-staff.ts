import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getStaffBySupabaseUserId } from "@/services/staffService";

// Structured, minimal logging for auth failures — enough to spot a pattern (repeated
// failures from the same source) later, never anything sensitive (no tokens, no
// passwords, no full user objects). Visible in Vercel's function logs once deployed.
// Real *alerting* on top of this needs a monitoring account — see SECURITY checklist.
function logAuthFailure(reason: "no_session" | "inactive_staff", extra?: Record<string, unknown>) {
  console.warn(JSON.stringify({ event: "auth_failure", reason, at: new Date().toISOString(), ...extra }));
}

// Every API route that touches real data must call this FIRST, before doing any
// other work (parsing the body, querying the DB) — an unauthenticated caller
// shouldn't cost the server anything beyond this check.
//
// Returns `{ error: NextResponse }` if the caller should be rejected — the route
// returns that response as-is. Returns `{ staff }` if the caller is a real,
// active staff member — the route proceeds normally.
export async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logAuthFailure("no_session");
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) } as const;
  }

  const staff = await getStaffBySupabaseUserId(user.id);
  if (!staff || !staff.active) {
    logAuthFailure("inactive_staff", { supabaseUserId: user.id });
    return { error: NextResponse.json({ error: "Not an active staff account" }, { status: 403 }) } as const;
  }

  return { staff } as const;
}

// For routes only the OWNER should touch (staff management, property/GST settings) —
// a FRONT_DESK/HOUSEKEEPING account passing requireStaff() shouldn't automatically
// get these too. Calls requireStaff() itself, so a route only needs one of the two.
export async function requireOwner() {
  const auth = await requireStaff();
  if (auth.error) return auth;
  if (auth.staff.role !== "OWNER") {
    console.warn(JSON.stringify({ event: "auth_failure", reason: "not_owner", staffId: auth.staff.id, at: new Date().toISOString() }));
    return { error: NextResponse.json({ error: "Owner access required" }, { status: 403 }) } as const;
  }
  return auth;
}
