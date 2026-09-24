import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrInitTodayRegister, setOpeningBalance, closeRegister } from "@/services/cashRegisterService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  return NextResponse.json(await getOrInitTodayRegister());
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set-opening-balance"), amount: z.number().min(0).max(10_000_000) }),
  z.object({ action: z.literal("close"), actualAmount: z.number().min(0).max(10_000_000) }),
]);

export async function PATCH(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "set-opening-balance") {
      const register = await setOpeningBalance(parsed.data.amount);
      await logAction({ staffId: auth.staff.id, action: "cash-register.set-opening-balance", entityType: "CashRegisterDay", entityId: register.id, details: { amount: parsed.data.amount } });
      return NextResponse.json(register);
    }
    const register = await closeRegister(parsed.data.actualAmount);
    await logAction({ staffId: auth.staff.id, action: "cash-register.close", entityType: "CashRegisterDay", entityId: register.id, details: { actualAmount: parsed.data.actualAmount, variance: register.variance } });
    return NextResponse.json(register);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update cash register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
