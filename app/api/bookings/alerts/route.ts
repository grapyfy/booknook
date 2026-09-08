import { NextResponse } from "next/server";
import { findOverbookingConflicts, findPossibleNoShows } from "@/services/bookingService";

// Both computed fresh from real data on every call — never a cached/fabricated count.
// See bookingService.findOverbookingConflicts / findPossibleNoShows.
export async function GET() {
  const [overbookingConflicts, possibleNoShows] = await Promise.all([
    findOverbookingConflicts(),
    findPossibleNoShows(),
  ]);
  return NextResponse.json({ overbookingConflicts, possibleNoShows });
}
