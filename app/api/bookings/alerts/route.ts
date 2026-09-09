import { NextResponse } from "next/server";
import { findOverbookingConflicts, findPossibleNoShows } from "@/services/bookingService";
import { requireStaff } from "@/lib/require-staff";

// Both computed fresh from real data on every call — never a cached/fabricated count.
// See bookingService.findOverbookingConflicts / findPossibleNoShows.
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const [overbookingConflicts, possibleNoShows] = await Promise.all([
    findOverbookingConflicts(),
    findPossibleNoShows(),
  ]);
  return NextResponse.json({ overbookingConflicts, possibleNoShows });
}
