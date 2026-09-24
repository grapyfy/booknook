import { db } from "@/lib/db";
import type { PaymentMethod, PaymentType } from "@prisma/client";

// Real payment bookkeeping — never a live Razorpay/gateway call. This is front
// desk recording that money was received/refunded, the same as writing it in a
// register; live checkout stays a disabled stub on the folio page (BYOG, per
// CLAUDE.md — this platform never touches guest money directly).

export async function listPaymentsForBooking(bookingId: string) {
  return db.payment.findMany({ where: { bookingId }, orderBy: { recordedAt: "asc" } });
}

export async function listPaymentsByDate(date: string) {
  const start = new Date(date);
  const end = new Date(new Date(date).getTime() + 86400000);
  return db.payment.findMany({ where: { recordedAt: { gte: start, lt: end } } });
}

export async function recordPayment(input: {
  bookingId: string;
  method: PaymentMethod;
  type: PaymentType;
  amount: number;
  note?: string;
}) {
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  return db.payment.create({ data: input });
}

// Derived, never stored — a booking's "amount due" is always the real total minus
// real recorded payments, computed fresh every time (same rule as GST/amount
// calculations elsewhere: never trust a cached number for money).
export interface BookingBalance {
  totalDue: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number; // positive = guest still owes this much; negative = overpaid/credit
}

export async function computeBookingBalance(bookingId: string, totalDue: number): Promise<BookingBalance> {
  const payments = await listPaymentsForBooking(bookingId);
  const totalPaid = payments.filter((p) => p.type !== "REFUND").reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments.filter((p) => p.type === "REFUND").reduce((sum, p) => sum + p.amount, 0);
  return { totalDue, totalPaid, totalRefunded, balance: totalDue - totalPaid + totalRefunded };
}

export async function listCreditNotesForBooking(bookingId: string) {
  return db.creditNote.findMany({ where: { bookingId }, orderBy: { createdAt: "desc" } });
}

async function nextCreditNoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.creditNote.count();
  return `CN-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function issueCreditNote(bookingId: string, amount: number, reason: string) {
  if (amount <= 0) throw new Error("Credit note amount must be greater than zero");
  return db.creditNote.create({
    data: { bookingId, amount, reason, creditNoteNumber: await nextCreditNoteNumber() },
  });
}

// A refund is a real payment record (type REFUND) plus its legally-required credit
// note, created together so recording one is never possible without the other —
// matches the mock layer's exact behavior, not a new business rule.
export async function recordRefund(input: { bookingId: string; method: PaymentMethod; amount: number; reason: string }) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: { bookingId: input.bookingId, method: input.method, type: "REFUND", amount: input.amount },
    });
    const year = new Date().getFullYear();
    const count = await tx.creditNote.count();
    const creditNote = await tx.creditNote.create({
      data: {
        bookingId: input.bookingId,
        amount: input.amount,
        reason: input.reason,
        creditNoteNumber: `CN-${year}-${String(count + 1).padStart(5, "0")}`,
      },
    });
    return { payment, creditNote };
  });
}
