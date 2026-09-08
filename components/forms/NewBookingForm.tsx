"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/types/room";
import type { Guest } from "@/types/booking";

const ID_TYPE_LABELS: Record<NonNullable<Guest["idType"]>, string> = {
  aadhaar: "Aadhaar",
  passport: "Passport",
  driving_license: "Driving licence",
  voter_id: "Voter ID",
  other: "Other",
};

export function NewBookingForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState<Guest["idType"] | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomNumber, setRoomNumber] = useState(rooms.find((r) => r.active)?.roomNumber ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = rooms.find((r) => r.roomNumber === roomNumber);
  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  // Client-side only — a preview, not the real total. The server (mock or real)
  // always recomputes this from the room's actual rate. Never trust this number.
  const estimatedAmount = selectedRoom ? selectedRoom.ratePerNight * nights : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createBookingAction({
      guest: {
        name,
        phone,
        email: email || undefined,
        idType: idType || undefined,
        idNumber: idNumber || undefined,
      },
      checkIn,
      checkOut,
      roomNumber,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.push("/bookings");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <FormField label="Guest name" htmlFor="name">
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Phone" htmlFor="phone">
        <Input
          id="phone"
          required
          placeholder="+919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </FormField>
      <FormField label="Email (optional)" htmlFor="email">
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="ID type (KYC, optional)" htmlFor="idType">
          <Select id="idType" value={idType} onChange={(e) => setIdType(e.target.value as Guest["idType"] | "")}>
            <option value="">Not captured</option>
            {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="ID number" htmlFor="idNumber">
          <Input
            id="idNumber"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            disabled={!idType}
            placeholder={idType ? "" : "Select an ID type first"}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Check-in" htmlFor="checkIn">
          <Input id="checkIn" type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </FormField>
        <FormField label="Check-out" htmlFor="checkOut">
          <Input id="checkOut" type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Room" htmlFor="room">
        <Select id="room" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}>
          {rooms.map((room) => (
            <option key={room.id} value={room.roomNumber} disabled={!room.active}>
              {room.roomNumber} — {room.roomType} · ₹{room.ratePerNight}/night{!room.active ? " (inactive)" : ""}
            </option>
          ))}
        </Select>
      </FormField>

      {nights > 0 && selectedRoom && (
        <p className="text-sm text-neutral-500">
          {nights} night{nights > 1 ? "s" : ""} × ₹{selectedRoom.ratePerNight} ≈ ₹
          {estimatedAmount.toLocaleString("en-IN")} (estimate — final amount is computed on save)
        </p>
      )}

      <FormField label="Notes / special requests (optional)" htmlFor="notes">
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. late arrival, extra bed, ground floor preferred"
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 resize-none"
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
