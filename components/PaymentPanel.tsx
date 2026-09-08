"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRotateLeft, faBan } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { recordPaymentAction, refundBookingAction, voidFolioAction } from "@/components/lib/actions";
import type { PaymentRecord, PaymentMethod, CreditNote } from "@/components/lib/paymentsMock";
import type { BookingBalance } from "@/components/lib/paymentsMock";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
};

export function PaymentPanel({
  bookingId,
  balance,
  payments,
  creditNotes,
  folioVoided,
}: {
  bookingId: string;
  balance: BookingBalance;
  payments: PaymentRecord[];
  creditNotes: CreditNote[];
  folioVoided: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [type, setType] = useState<"advance" | "partial" | "full">("full");
  const [amount, setAmount] = useState(String(Math.max(balance.balance, 0) || ""));
  const [note, setNote] = useState("");

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("cash");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const [showVoidForm, setShowVoidForm] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await recordPaymentAction({ bookingId, method, type, amount: Number(amount), note: note || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowRecordForm(false);
      setNote("");
      router.refresh();
    });
  }

  function submitRefund(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await refundBookingAction({ bookingId, method: refundMethod, amount: Number(refundAmount), reason: refundReason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowRefundForm(false);
      setRefundAmount("");
      setRefundReason("");
      router.refresh();
    });
  }

  function submitVoid(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await voidFolioAction(bookingId, voidReason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowVoidForm(false);
      setVoidReason("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-medium text-sm">Payments</div>
        <div
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            balance.balance > 0 ? "bg-red-100 text-red-700" : balance.balance < 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}
        >
          {balance.balance > 0
            ? `₹${balance.balance.toLocaleString("en-IN")} due`
            : balance.balance < 0
              ? `₹${Math.abs(balance.balance).toLocaleString("en-IN")} credit`
              : "Paid in full"}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="flex flex-col gap-2 text-sm font-mono">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-neutral-600">
              <span className="font-sans">
                {METHOD_LABELS[p.method]} · {p.type} {p.note ? `— ${p.note}` : ""}
              </span>
              <span className={p.type === "refund" ? "text-red-600" : ""}>
                {p.type === "refund" ? "-" : ""}₹{p.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}

      {creditNotes.length > 0 && (
        <div className="flex flex-col gap-1 text-xs text-neutral-500 border-t border-neutral-100 pt-3">
          {creditNotes.map((c) => (
            <div key={c.id}>
              <span className="font-mono">{c.creditNoteNumber}</span> — ₹{c.amount.toLocaleString("en-IN")} ({c.reason})
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!showRecordForm && !showRefundForm && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRecordForm(true)} disabled={pending || folioVoided}>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Record payment
          </Button>
          {balance.totalPaid > balance.totalRefunded && (
            <Button variant="secondary" onClick={() => setShowRefundForm(true)} disabled={pending}>
              <FontAwesomeIcon icon={faRotateLeft} className="h-3.5 w-3.5" />
              Refund
            </Button>
          )}
        </div>
      )}

      {showRecordForm && (
        <form onSubmit={submitPayment} className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {Object.entries(METHOD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="full">Full payment</option>
              <option value="partial">Partial payment</option>
              <option value="advance">Advance</option>
            </Select>
          </div>
          <Input type="number" min={1} required placeholder="Amount ₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save payment"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowRecordForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showRefundForm && (
        <form onSubmit={submitRefund} className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
          <Select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}>
            {Object.entries(METHOD_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Input type="number" min={1} required placeholder="Refund amount ₹" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          <Input required placeholder="Reason (required — a credit note will be issued)" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Processing..." : "Confirm refund"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowRefundForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!folioVoided && !showVoidForm && (
        <button
          onClick={() => setShowVoidForm(true)}
          className="self-start inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-600 mt-1"
        >
          <FontAwesomeIcon icon={faBan} className="h-3 w-3" />
          Void this invoice
        </button>
      )}
      {showVoidForm && (
        <form onSubmit={submitVoid} className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
          <Input required placeholder="Reason for voiding (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={pending}>
              Void invoice
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowVoidForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
