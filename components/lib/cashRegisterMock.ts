// Cash register — one entry per day. "Cash received" is computed for real
// from actual cash-method payment records (paymentsMock.ts), not invented;
// "cash paid out" (petty expenses, cash refunds) is logged manually here.
import fs from "fs";
import path from "path";
import { listPaymentsByDateMock } from "@/components/lib/paymentsMock";

export interface CashPaidOutEntry {
  id: string;
  amount: number;
  note: string;
  at: string;
}

export interface CashRegisterDay {
  date: string;
  openingBalance: number;
  paidOut: CashPaidOutEntry[];
  closingBalanceActual?: number;
  closedAt?: string;
}

interface RegisterStore {
  days: Record<string, CashRegisterDay>; // keyed by date
  nextId: number;
}

const REGISTER_STORE_PATH = path.join(process.cwd(), ".mock-store-cash-register.json");

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadRegisterStore(): RegisterStore {
  try {
    const raw = fs.readFileSync(REGISTER_STORE_PATH, "utf-8");
    return JSON.parse(raw) as RegisterStore;
  } catch {
    return { days: {}, nextId: 0 };
  }
}

function saveRegisterStore(store: RegisterStore): void {
  fs.writeFileSync(REGISTER_STORE_PATH, JSON.stringify(store, null, 2));
}

// Cash received today = sum of real cash-method payments recorded today,
// minus cash refunds recorded today — always derived, never stored.
function cashReceivedForDate(date: string): number {
  const payments = listPaymentsByDateMock(date).filter((p) => p.method === "cash");
  const received = payments.filter((p) => p.type !== "refund").reduce((sum, p) => sum + p.amount, 0);
  const refunded = payments.filter((p) => p.type === "refund").reduce((sum, p) => sum + p.amount, 0);
  return received - refunded;
}

export interface CashRegisterSummary extends CashRegisterDay {
  cashReceived: number;
  totalPaidOut: number;
  closingBalanceExpected: number;
  variance?: number;
}

function summarize(day: CashRegisterDay): CashRegisterSummary {
  const cashReceived = cashReceivedForDate(day.date);
  const totalPaidOut = day.paidOut.reduce((sum, e) => sum + e.amount, 0);
  const closingBalanceExpected = day.openingBalance + cashReceived - totalPaidOut;
  const variance = typeof day.closingBalanceActual === "number" ? day.closingBalanceActual - closingBalanceExpected : undefined;
  return { ...day, cashReceived, totalPaidOut, closingBalanceExpected, variance };
}

// Opening balance defaults to the most recent closed day's actual closing
// balance (real drawer continuity) — 0 if there's no prior closed day.
export function getOrInitTodayRegisterMock(): CashRegisterSummary {
  const store = loadRegisterStore();
  const today = todayISO();
  if (!store.days[today]) {
    const priorClosedDays = Object.values(store.days)
      .filter((d) => typeof d.closingBalanceActual === "number")
      .sort((a, b) => b.date.localeCompare(a.date));
    const openingBalance = priorClosedDays[0]?.closingBalanceActual ?? 0;
    store.days[today] = { date: today, openingBalance, paidOut: [] };
    saveRegisterStore(store);
  }
  return summarize(store.days[today]);
}

export function setOpeningBalanceMock(amount: number): CashRegisterSummary {
  const store = loadRegisterStore();
  const today = todayISO();
  if (!store.days[today]) store.days[today] = { date: today, openingBalance: 0, paidOut: [] };
  if (store.days[today].closedAt) throw new Error("Today's register is already closed");
  store.days[today].openingBalance = Math.max(0, amount);
  saveRegisterStore(store);
  return summarize(store.days[today]);
}

export function addCashPaidOutMock(amount: number, note: string): CashRegisterSummary {
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const store = loadRegisterStore();
  const today = todayISO();
  if (!store.days[today]) store.days[today] = { date: today, openingBalance: 0, paidOut: [] };
  if (store.days[today].closedAt) throw new Error("Today's register is already closed");
  store.nextId += 1;
  store.days[today].paidOut.push({ id: `co${store.nextId}`, amount, note, at: new Date().toISOString() });
  saveRegisterStore(store);
  return summarize(store.days[today]);
}

export function closeRegisterMock(actualAmount: number): CashRegisterSummary {
  const store = loadRegisterStore();
  const today = todayISO();
  if (!store.days[today]) throw new Error("No register open for today");
  if (store.days[today].closedAt) throw new Error("Today's register is already closed");
  store.days[today].closingBalanceActual = Math.max(0, actualAmount);
  store.days[today].closedAt = new Date().toISOString();
  saveRegisterStore(store);
  return summarize(store.days[today]);
}

export function listRegisterHistoryMock(): CashRegisterSummary[] {
  const store = loadRegisterStore();
  return Object.values(store.days)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(summarize);
}
