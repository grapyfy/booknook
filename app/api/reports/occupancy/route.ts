import { NextRequest, NextResponse } from "next/server";
import { getOccupancyReport } from "@/services/reportsService";

function toCsv(report: Awaited<ReturnType<typeof getOccupancyReport>>): string {
  const summaryRows = [
    ["Range", `${report.rangeStart} to ${report.rangeEnd}`],
    ["Active rooms", String(report.totalActiveRooms)],
    ["Room-nights available", String(report.roomNightsAvailable)],
    ["Room-nights sold", String(report.roomNightsSold)],
    ["Occupancy %", String(report.occupancyRate)],
    ["Room revenue", String(report.roomRevenue)],
    ["ADR", String(report.adr)],
    ["RevPAR", String(report.revPAR)],
  ];
  const revenueByRoomRows = report.revenueByRoom.map((r) => [r.roomNumber, String(r.revenue)]);
  return [
    ...summaryRows.map((r) => r.join(",")),
    "",
    "Room Number,Revenue",
    ...revenueByRoomRows.map((r) => r.join(",")),
  ].join("\n");
}

// Defaults to the last 7 days (matches the dashboard's window) if no range is given.
export async function GET(req: NextRequest) {
  const startParam = req.nextUrl.searchParams.get("start");
  const endParam = req.nextUrl.searchParams.get("end");
  const format = req.nextUrl.searchParams.get("format"); // "csv" or omitted (json)

  const rangeEnd = endParam ? new Date(endParam) : new Date(new Date().toDateString());
  const rangeStart = startParam
    ? new Date(startParam)
    : new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime()) || rangeEnd <= rangeStart) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const report = await getOccupancyReport(rangeStart, rangeEnd);

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="occupancy-report-${report.rangeStart}-to-${report.rangeEnd}.csv"`,
      },
    });
  }
  return NextResponse.json(report);
}
