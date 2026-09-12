"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRateRuleAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  RATE_RULE_TYPE_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  DAY_LABELS,
} from "@/constants/rateRules";
import type { RateRuleType, AdjustmentType } from "@/constants/rateRules";

export function RateRuleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<RateRuleType>("WEEKLY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("PERCENT");
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [priority, setPriority] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createRateRuleAction({
      name,
      type,
      daysOfWeek: type === "WEEKLY" ? daysOfWeek : undefined,
      startDate: type === "DATE_RANGE" ? startDate : undefined,
      endDate: type === "DATE_RANGE" ? endDate : undefined,
      adjustmentType,
      adjustmentValue: Number(adjustmentValue) || 0,
      priority: Number(priority) || 0,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setDaysOfWeek([]);
    setStartDate("");
    setEndDate("");
    setAdjustmentValue("");
    setPriority("0");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Rule name" htmlFor="rr-name">
          <Input
            id="rr-name"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend surcharge"
          />
        </FormField>
        <FormField label="Applies to" htmlFor="rr-type">
          <Select id="rr-type" value={type} onChange={(e) => setType(e.target.value as RateRuleType)}>
            {Object.entries(RATE_RULE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {type === "WEEKLY" ? (
        <FormField label="Days of the week">
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                  daysOfWeek.includes(day)
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </FormField>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start date" htmlFor="rr-start">
            <Input id="rr-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End date" htmlFor="rr-end">
            <Input id="rr-end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Adjustment" htmlFor="rr-adj-type">
          <Select id="rr-adj-type" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}>
            {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={adjustmentType === "PERCENT" ? "Amount (%)" : "Amount (₹)"} htmlFor="rr-adj-value">
          <Input
            id="rr-adj-value"
            type="number"
            min={0}
            max={adjustmentType === "PERCENT" ? 100 : 100000}
            required
            value={adjustmentValue}
            onChange={(e) => setAdjustmentValue(e.target.value)}
          />
        </FormField>
        <FormField label="Priority" htmlFor="rr-priority">
          <Input
            id="rr-priority"
            type="number"
            min={0}
            max={1000}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </FormField>
      </div>
      <p className="text-xs text-neutral-500 -mt-2">
        When more than one rule matches the same night, the higher-priority rule wins outright — rules never stack.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add rate rule"}
        </Button>
      </div>
    </form>
  );
}
