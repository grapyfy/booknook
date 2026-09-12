"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { setRateRuleActiveAction, deleteRateRuleAction } from "@/components/lib/actions";
import { ADJUSTMENT_TYPE_LABELS, DAY_LABELS } from "@/constants/rateRules";
import type { RateRule } from "@/components/lib/rateRulesMock";

export function RateRuleRow({ rule }: { rule: RateRule }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await setRateRuleActiveAction(rule.id, !rule.active);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete "${rule.name}"? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRateRuleAction(rule.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const when =
    rule.type === "WEEKLY"
      ? rule.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ") || "No days selected"
      : `${rule.startDate} → ${rule.endDate}`;

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-4 py-3 font-medium">{rule.name}</td>
      <td className="px-4 py-3 text-neutral-600">{when}</td>
      <td className="px-4 py-3 font-mono">
        {rule.adjustmentType === "PERCENT" ? `+${rule.adjustmentValue}%` : `+₹${rule.adjustmentValue.toLocaleString("en-IN")}`}
        <span className="text-neutral-400 font-sans"> ({ADJUSTMENT_TYPE_LABELS[rule.adjustmentType]})</span>
      </td>
      <td className="px-4 py-3 font-mono">{rule.priority}</td>
      <td className="px-4 py-3">
        <button
          onClick={toggleActive}
          disabled={pending}
          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
            rule.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {rule.active ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={remove}
          disabled={pending}
          aria-label={`Delete ${rule.name}`}
          className="h-7 w-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ml-auto"
        >
          <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
    </tr>
  );
}
