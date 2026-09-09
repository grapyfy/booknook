import { NextRequest, NextResponse } from "next/server";
import { importBookingsFromCsv } from "@/services/importService";
import { requireStaff } from "@/lib/require-staff";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — a real hotel's Excel export is nowhere near this; guards against resource exhaustion

// Accepts a CSV file upload (multipart/form-data, field name "file") and returns the
// "Nothing Lost" report: every row is either imported or flagged with a specific reason —
// nothing is silently dropped. See CLAUDE.md / PRD Module J.
export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  // Imports are rare, deliberate actions (data migration) — 5/hour is plenty and
  // catches an accidental or malicious repeated-upload loop.
  const limited = await checkRateLimit(`csv_import_${auth.staff.id}`, 5, 60 * 60_000);
  if (limited) return NextResponse.json({ error: "Too many imports too quickly — try again later" }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV file under the 'file' field" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "Only .csv files are supported for now (not .xlsx)" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large — max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` }, { status: 413 });
  }

  const csvText = await file.text();
  const report = await importBookingsFromCsv(csvText);

  return NextResponse.json(report, { status: 200 });
}
