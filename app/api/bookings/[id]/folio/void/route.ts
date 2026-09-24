import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFolio, voidFolio } from "@/services/billingService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

const schema = z.object({ reason: z.string().min(1).max(500) });

// Voids the booking's current (latest non-voided) invoice — the voided row stays
// as audit history (GST law requires an invoice number to never disappear); the
// next GET/POST on .../folio correctly generates a fresh one, since a voided row
// no longer counts as "the current folio" (see billingService.generateFolio).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const current = await getFolio(id);
  if (!current) return NextResponse.json({ error: "No active invoice to void for this booking" }, { status: 404 });

  try {
    const voided = await voidFolio(current.id, parsed.data.reason);
    await logAction({ staffId: auth.staff.id, action: "folio.void", entityType: "Folio", entityId: voided.id, details: { bookingId: id, invoiceNumber: voided.invoiceNumber, reason: parsed.data.reason } });
    return NextResponse.json(voided);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not void invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
