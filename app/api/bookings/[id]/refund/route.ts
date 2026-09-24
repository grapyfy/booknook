import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordRefund } from "@/services/paymentService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

const schema = z.object({
  method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER"]),
  amount: z.number().positive().max(10_000_000),
  reason: z.string().min(1).max(500),
});

// A refund always creates its legally-required credit note in the same action —
// see paymentService.recordRefund, a real Prisma transaction, not two separate steps.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await recordRefund({ bookingId: id, ...parsed.data });
    await logAction({
      staffId: auth.staff.id,
      action: "payment.refund",
      entityType: "Payment",
      entityId: result.payment.id,
      details: { bookingId: id, amount: parsed.data.amount, creditNoteNumber: result.creditNote.creditNoteNumber, reason: parsed.data.reason },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not process refund";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
