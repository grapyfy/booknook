import { NextRequest, NextResponse } from "next/server";
import { generateFolio, getFolio } from "@/services/billingService";
import { requireStaff } from "@/lib/require-staff";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const folio = await getFolio(id);
  if (!folio) return NextResponse.json({ error: "No folio yet for this booking" }, { status: 404 });
  return NextResponse.json(folio);
}

// Generates the GST bill for a booking. Safe to call more than once — returns the
// existing folio instead of creating a duplicate (see billingService.generateFolio).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const folio = await generateFolio(id);
    return NextResponse.json(folio, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
}
