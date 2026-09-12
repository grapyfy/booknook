"use client";

import { useState } from "react";
import { updateDefaultTimesAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";

// Real, wired to PropertySettings — unlike the rest of this tab (still a mock
// preview, Gautam's stub). Owner-only per updateDefaultTimesAction.
export function DefaultTimesForm({ defaultCheckInTime, defaultCheckOutTime }: { defaultCheckInTime: string; defaultCheckOutTime: string }) {
  const [checkInTime, setCheckInTime] = useState(defaultCheckInTime);
  const [checkOutTime, setCheckOutTime] = useState(defaultCheckOutTime);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateDefaultTimesAction({ defaultCheckInTime: checkInTime, defaultCheckOutTime: checkOutTime });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4 max-w-lg">
      <div>
        <h2 className="font-medium text-sm">Check-in / check-out times</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Hotel-wide default — prefills every new booking&apos;s time, which front desk can still adjust per guest.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Default check-in" htmlFor="defaultCheckInTime">
          <Input id="defaultCheckInTime" type="time" required value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        </FormField>
        <FormField label="Default check-out" htmlFor="defaultCheckOutTime">
          <Input id="defaultCheckOutTime" type="time" required value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        </FormField>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving..." : "Save times"}
      </Button>
    </form>
  );
}
