"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setOpeningBalanceAction, addCashPaidOutAction, closeRegisterAction } from "@/components/lib/actions";
import type { CashRegisterSummary } from "@/components/lib/cashRegisterMock";

export function CashRegisterPanel({ today }: { today: CashRegisterSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [openingInput, setOpeningInput] = useState(String(today.openingBalance));
  const [editingOpening, setEditingOpening] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");

  const [closeAmount, setCloseAmount] = useState(String(today.closingBalanceExpected));
  const [closing, setClosing] = useState(false);

  const isClosed = !!today.closedAt;

  function saveOpening(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setOpeningBalanceAction(Number(openingInput));
      if (!result.ok) return setError(result.error);
      setEditingOpening(false);
      router.refresh();
    });
  }

  function logPayout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCashPaidOutAction(Number(payoutAmount), payoutNote);
      if (!result.ok) return setError(result.error);
      setPayoutAmount("");
      setPayoutNote("");
      router.refresh();
    });
  }

  function doClose(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await closeRegisterAction(Number(closeAmount));
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-neutral-500">Opening balance</div>
            {editingOpening ? (
              <form onSubmit={saveOpening} className="flex gap-2 mt-1">
                <Input type="number" min={0} value={openingInput} onChange={(e) => setOpeningInput(e.target.value)} className="w-32" />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Save
                </Button>
              </form>
            ) : (
              <div className="font-mono font-medium mt-1 flex items-center gap-2">
                ₹{today.openingBalance.toLocaleString("en-IN")}
                {!isClosed && (
                  <button onClick={() => setEditingOpening(true)} className="text-xs text-blue-600 hover:underline font-sans">
                    edit
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="text-neutral-500">Cash received today</div>
            <div className="font-mono font-medium mt-1">₹{today.cashReceived.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="text-neutral-500">Cash paid out</div>
            <div className="font-mono font-medium mt-1">₹{today.totalPaidOut.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="text-neutral-500">Expected closing balance</div>
            <div className="font-mono font-semibold mt-1">₹{today.closingBalanceExpected.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {today.paidOut.length > 0 && (
          <div className="border-t border-neutral-100 pt-3 flex flex-col gap-1 text-sm">
            {today.paidOut.map((p) => (
              <div key={p.id} className="flex justify-between text-neutral-600">
                <span>{p.note}</span>
                <span className="font-mono">₹{p.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isClosed && (
          <form onSubmit={logPayout} className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
            <Input placeholder="What was paid out" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} className="flex-1" />
            <Input type="number" min={1} placeholder="₹" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} className="w-24" />
            <Button type="submit" variant="secondary" disabled={pending}>
              Log paid out
            </Button>
          </form>
        )}
      </div>

      {isClosed ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Register closed</div>
            <div className="text-xs text-neutral-500">Counted: ₹{today.closingBalanceActual!.toLocaleString("en-IN")}</div>
          </div>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              today.variance === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {today.variance === 0 ? "No variance" : `${today.variance! > 0 ? "+" : ""}₹${today.variance!.toLocaleString("en-IN")} variance`}
          </span>
        </div>
      ) : !closing ? (
        <Button onClick={() => setClosing(true)} className="self-start">
          Close today&apos;s register
        </Button>
      ) : (
        <form onSubmit={doClose} className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-3">
          <label className="text-sm font-medium text-neutral-700">Actual cash counted in drawer</label>
          <Input type="number" min={0} value={closeAmount} onChange={(e) => setCloseAmount(e.target.value)} className="w-40" />
          <p className="text-xs text-neutral-400">Expected: ₹{today.closingBalanceExpected.toLocaleString("en-IN")}</p>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              Confirm close
            </Button>
            <Button type="button" variant="secondary" onClick={() => setClosing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
