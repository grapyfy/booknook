import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPaymentsForBooking, recordPayment } from "@/services/paymentService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  return NextResponse.json(await listPaymentsForBooking(id));
}

const schema = z.object({
  method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER"]),
  type: z.enum(["ADVANCE", "PARTIAL", "FULL"]), // REFUND has its own dedicated endpoint — see /refund
  amount: z.number().positive().max(10_000_000),
  note: z.string().max(500).optional(),
});

// Real front-desk bookkeeping — never a live gateway call. See CLAUDE.md's BYOG
// rule: this platform never touches guest money directly.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const payment = await recordPayment({ bookingId: id, ...parsed.data });
    await logAction({ staffId: auth.staff.id, action: "payment.record", entityType: "Payment", entityId: payment.id, details: { bookingId: id, method: parsed.data.method, type: parsed.data.type, amount: parsed.data.amount } });
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not record payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
