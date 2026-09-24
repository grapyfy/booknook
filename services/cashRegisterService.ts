import { db } from "@/lib/db";

function startOfDay(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

// Cash received for a date is always derived fresh from real cash-method Payment
// rows — never stored, same "never trust a cached money number" rule as GST/amount
// calculations elsewhere. Refunds paid out in cash reduce it, matching the mock's
// exact logic.
async function cashReceivedForDate(date: Date): Promise<number> {
  const start = startOfDay(date);
  const end = new Date(start.getTime() + 86400000);
  const payments = await db.payment.findMany({
    where: { method: "CASH", recordedAt: { gte: start, lt: end } },
  });
  const received = payments.filter((p) => p.type !== "REFUND").reduce((sum, p) => sum + p.amount, 0);
  const refunded = payments.filter((p) => p.type === "REFUND").reduce((sum, p) => sum + p.amount, 0);
  return received - refunded;
}

export interface CashRegisterSummary {
  id: string;
  date: string;
  openingBalance: number;
  paidOut: { id: string; amount: number; note: string; at: string }[];
  closingBalanceActual?: number;
  closedAt?: string;
  cashReceived: number;
  totalPaidOut: number;
  closingBalanceExpected: number;
  variance?: number;
}

async function summarize(row: {
  id: string;
  date: Date;
  openingBalance: number;
  closingBalanceActual: number | null;
  closedAt: Date | null;
  paidOutEntries: { id: string; amount: number; note: string; createdAt: Date }[];
}): Promise<CashRegisterSummary> {
  const cashReceived = await cashReceivedForDate(row.date);
  const totalPaidOut = row.paidOutEntries.reduce((sum, e) => sum + e.amount, 0);
  const closingBalanceExpected = row.openingBalance + cashReceived - totalPaidOut;
  const variance = row.closingBalanceActual !== null ? row.closingBalanceActual - closingBalanceExpected : undefined;
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    openingBalance: row.openingBalance,
    paidOut: row.paidOutEntries.map((e) => ({ id: e.id, amount: e.amount, note: e.note, at: e.createdAt.toISOString() })),
    closingBalanceActual: row.closingBalanceActual ?? undefined,
    closedAt: row.closedAt?.toISOString(),
    cashReceived,
    totalPaidOut,
    closingBalanceExpected,
    variance,
  };
}

// Opening balance defaults to the most recent CLOSED day's actual closing balance —
// real drawer continuity, not a guess — or 0 if there's no prior closed day.
export async function getOrInitTodayRegister(): Promise<CashRegisterSummary> {
  const today = startOfDay(new Date());
  const existing = await db.cashRegisterDay.findUnique({ where: { date: today }, include: { paidOutEntries: true } });
  if (existing) return summarize(existing);

  const lastClosed = await db.cashRegisterDay.findFirst({
    where: { closedAt: { not: null } },
    orderBy: { date: "desc" },
  });
  const created = await db.cashRegisterDay.create({
    data: { date: today, openingBalance: lastClosed?.closingBalanceActual ?? 0 },
    include: { paidOutEntries: true },
  });
  return summarize(created);
}

export async function setOpeningBalance(amount: number): Promise<CashRegisterSummary> {
  const today = await getOrInitTodayRegister();
  if (today.closedAt) throw new Error("Today's register is already closed");
  const row = await db.cashRegisterDay.update({
    where: { id: today.id },
    data: { openingBalance: amount },
    include: { paidOutEntries: true },
  });
  return summarize(row);
}

export async function addCashPaidOut(amount: number, note: string): Promise<CashRegisterSummary> {
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const today = await getOrInitTodayRegister();
  if (today.closedAt) throw new Error("Today's register is already closed");
  await db.cashPaidOutEntry.create({ data: { registerId: today.id, amount, note } });
  const row = await db.cashRegisterDay.findUniqueOrThrow({ where: { id: today.id }, include: { paidOutEntries: true } });
  return summarize(row);
}

export async function closeRegister(actualAmount: number): Promise<CashRegisterSummary> {
  const today = await getOrInitTodayRegister();
  if (today.closedAt) throw new Error("Today's register is already closed");
  const row = await db.cashRegisterDay.update({
    where: { id: today.id },
    data: { closingBalanceActual: actualAmount, closedAt: new Date() },
    include: { paidOutEntries: true },
  });
  return summarize(row);
}

export async function listRegisterHistory(): Promise<CashRegisterSummary[]> {
  const rows = await db.cashRegisterDay.findMany({
    orderBy: { date: "desc" },
    include: { paidOutEntries: true },
  });
  return Promise.all(rows.map(summarize));
}
