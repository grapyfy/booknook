import { NextRequest, NextResponse } from "next/server";
import { importBookingsFromCsv } from "@/services/importService";

// Accepts a CSV file upload (multipart/form-data, field name "file") and returns the
// "Nothing Lost" report: every row is either imported or flagged with a specific reason —
// nothing is silently dropped. See CLAUDE.md / PRD Module J.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV file under the 'file' field" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "Only .csv files are supported for now (not .xlsx)" }, { status: 400 });
  }

  const csvText = await file.text();
  const report = await importBookingsFromCsv(csvText);

  return NextResponse.json(report, { status: 200 });
}
