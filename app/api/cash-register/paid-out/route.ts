import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addCashPaidOut } from "@/services/cashRegisterService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

const schema = z.object({
  amount: z.number().positive().max(10_000_000),
  note: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const register = await addCashPaidOut(parsed.data.amount, parsed.data.note);
    await logAction({ staffId: auth.staff.id, action: "cash-register.paid-out", entityType: "CashRegisterDay", entityId: register.id, details: { amount: parsed.data.amount, note: parsed.data.note } });
    return NextResponse.json(register, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not record cash paid out";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
