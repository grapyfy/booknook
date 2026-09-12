// Payment recording + credit notes — a new mock domain, same file-persistence
// pattern as bookings. Deliberately NOT a live payment gateway integration:
// this records that money was received/refunded (front desk bookkeeping),
// which is a normal internal action — it never touches a real Razorpay
// account. Live checkout stays a disabled stub on the folio page, per
// CLAUDE.md's BYOG rule (no pooled payments, no gateway wiring here).
import fs from "fs";
import path from "path";
// Payment-method list + labels live in constants/payments.ts (no fs/path
// import) so client components can import the value without pulling this
// file's Node-only mock-store code into their bundle.
import type { PaymentMethod } from "@/constants/payments";
export type { PaymentMethod };
export { PAYMENT_METHODS } from "@/constants/payments";

export type PaymentType = "advance" | "partial" | "full" | "refund";

export interface PaymentRecord {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  type: PaymentType;
  amount: number; // always positive — a refund's direction comes from `type`, not a negative amount
  note?: string;
  recordedAt: string;
}

export interface CreditNote {
  id: string;
  bookingId: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface PayStore {
  payments: PaymentRecord[];
  creditNotes: CreditNote[];
  nextId: number;
}

const PAY_STORE_PATH = path.join(process.cwd(), ".mock-store-payments.json");

// Seeded so the folio/reports/cash-register screens have real data to show
// without every reviewer having to record a payment first.
const SEED_PAYMENTS: PaymentRecord[] = [
  { id: "pay1", bookingId: "b2", method: "upi", type: "full", amount: 13500, recordedAt: "2026-09-04T09:20:00.000Z" },
  { id: "pay2", bookingId: "b4", method: "cash", type: "partial", amount: 9000, recordedAt: "2026-09-08T10:00:00.000Z" },
];

function loadPayStore(): PayStore {
  try {
    const raw = fs.readFileSync(PAY_STORE_PATH, "utf-8");
    return JSON.parse(raw) as PayStore;
  } catch {
    return { payments: [...SEED_PAYMENTS], creditNotes: [], nextId: 100 };
  }
}

function savePayStore(store: PayStore): void {
  fs.writeFileSync(PAY_STORE_PATH, JSON.stringify(store, null, 2));
}

export function listPaymentsForBookingMock(bookingId: string): PaymentRecord[] {
  return loadPayStore()
    .payments.filter((p) => p.bookingId === bookingId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function listPaymentsByDateMock(date: string): PaymentRecord[] {
  return loadPayStore().payments.filter((p) => p.recordedAt.slice(0, 10) === date);
}

export function recordPaymentMock(input: {
  bookingId: string;
  method: PaymentMethod;
  type: PaymentType;
  amount: number;
  note?: string;
}): PaymentRecord {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  const store = loadPayStore();
  store.nextId += 1;
  const record: PaymentRecord = {
    id: `pay${store.nextId}`,
    bookingId: input.bookingId,
    method: input.method,
    type: input.type,
    amount: input.amount,
    note: input.note,
    recordedAt: new Date().toISOString(),
  };
  store.payments.push(record);
  savePayStore(store);
  return record;
}

// Balance is derived, never stored — a booking's "amount due" is always the
// real total minus real recorded payments, computed fresh every time.
export interface BookingBalance {
  totalDue: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number; // positive = guest still owes this much; negative = overpaid/credit
}

export function computeBookingBalanceMock(bookingId: string, totalDue: number): BookingBalance {
  const payments = listPaymentsForBookingMock(bookingId);
  const totalPaid = payments.filter((p) => p.type !== "refund").reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments.filter((p) => p.type === "refund").reduce((sum, p) => sum + p.amount, 0);
  return { totalDue, totalPaid, totalRefunded, balance: totalDue - totalPaid + totalRefunded };
}

export function listCreditNotesForBookingMock(bookingId: string): CreditNote[] {
  return loadPayStore().creditNotes.filter((c) => c.bookingId === bookingId);
}

export function issueCreditNoteMock(bookingId: string, amount: number, reason: string): CreditNote {
  if (amount <= 0) throw new Error("Credit note amount must be greater than zero");
  const store = loadPayStore();
  const year = new Date().getFullYear();
  const note: CreditNote = {
    id: `cn${store.nextId + 1}`,
    bookingId,
    creditNoteNumber: `CN-${year}-${String(store.creditNotes.length + 1).padStart(5, "0")}`,
    amount,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.nextId += 1;
  store.creditNotes.push(note);
  savePayStore(store);
  return note;
}
