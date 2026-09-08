import { NextRequest, NextResponse } from "next/server";
import { listTasksForDate } from "@/services/housekeepingService";

// Defaults to today. Auto-creates a DIRTY task for any active room that doesn't
// have one yet for this date — see housekeepingService.listTasksForDate.
export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  return NextResponse.json(await listTasksForDate(date));
}
