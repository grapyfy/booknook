"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoomAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";

export function NewRoomForm() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("");
  const [ratePerNight, setRatePerNight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createRoomAction({
      roomNumber,
      roomType,
      ratePerNight: Number(ratePerNight),
    });
    setSubmitting(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.push("/rooms");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <FormField label="Room number" htmlFor="roomNumber">
        <Input id="roomNumber" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
      </FormField>
      <FormField label="Room type" htmlFor="roomType">
        <Input
          id="roomType"
          required
          placeholder="Standard, Deluxe, Suite…"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
        />
      </FormField>
      <FormField label="Rate per night (₹)" htmlFor="rate">
        <Input
          id="rate"
          type="number"
          min={1}
          required
          value={ratePerNight}
          onChange={(e) => setRatePerNight(e.target.value)}
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Add room"}
        </Button>
      </div>
    </form>
  );
}
