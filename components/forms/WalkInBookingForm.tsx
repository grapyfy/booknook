"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { createWalkInBookingAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/types/room";
import type { Booking } from "@/types/booking";
import { gstRateForRoomRate, type GstConfig } from "@/lib/gst";

const PAYMENT_STATUS_OPTIONS: { value: NonNullable<Booking["paymentStatus"]>; label: string }[] = [
  { value: "postpaid", label: "Postpaid — pay at checkout" },
  { value: "prepaid", label: "Prepaid — already paid in full" },
  { value: "partial", label: "Partially paid" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function WalkInBookingForm({
  rooms,
  gstConfig,
  defaultCheckOutTime,
}: {
  rooms: Room[];
  gstConfig: GstConfig;
  defaultCheckOutTime: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(tomorrowISO());
  // Check-in defaults to right now — the guest is physically at the desk,
  // unlike an advance booking's planned future arrival. Check-out still uses
  // the hotel's configured default (staff can adjust either).
  const [checkInTime, setCheckInTime] = useState(nowHHMM());
  const [checkOutTime, setCheckOutTime] = useState(defaultCheckOutTime);
  const [roomNumber, setRoomNumber] = useState(rooms.find((r) => r.active)?.roomNumber ?? "");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<NonNullable<Booking["paymentStatus"]>>("postpaid");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Same "fail open, never the only guard" availability check as NewBookingForm —
  // createWalkInBookingAction's real createBooking call still re-checks server-side.
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState<Set<string> | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailableRoomNumbers(null);
      return;
    }
    let cancelled = false;
    setCheckingAvailability(true);
    fetch(`/api/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Room[]) => {
        if (!cancelled) setAvailableRoomNumbers(new Set(data.map((r) => r.roomNumber)));
      })
      .catch(() => {
        if (!cancelled) setAvailableRoomNumbers(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut]);

  const selectedRoom = rooms.find((r) => r.roomNumber === roomNumber);
  const selectedRoomUnavailable =
    availableRoomNumbers !== null && roomNumber !== "" && !availableRoomNumbers.has(roomNumber);
  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const ratePerNight = selectedRoom?.ratePerNight ?? 0;
  const subtotal = ratePerNight * nights;
  // Same real, configured GST slab as NewBookingForm (never a hardcoded duplicate) —
  // preview only, generateFolio recomputes this for real on save.
  const gstRate = gstRateForRoomRate(ratePerNight, gstConfig);
  const gstAmount = Math.round((subtotal * gstRate) / 100);
  const estimatedAmount = subtotal + gstAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createWalkInBookingAction({
      guest: { name, phone },
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      roomNumber,
      notes: notes || undefined,
      paymentStatus,
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
      <p className="text-sm text-neutral-500">
        Guest is at the desk right now — this creates the booking already <strong>checked-in</strong>, no separate
        confirm step.
      </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Check-in" htmlFor="checkIn">
          <div className="flex gap-2">
            <Input id="checkIn" type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="flex-1" />
            <Input type="time" required value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-28" />
          </div>
        </FormField>
        <FormField label="Check-out" htmlFor="checkOut">
          <div className="flex gap-2">
            <Input id="checkOut" type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="flex-1" />
            <Input type="time" required value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="w-28" />
          </div>
        </FormField>
      </div>
      <FormField label="Room" htmlFor="room">
        <Select id="room" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}>
          {rooms.map((room) => {
            const known = availableRoomNumbers !== null;
            const isAvailable = !known || availableRoomNumbers!.has(room.roomNumber);
            return (
              <option key={room.id} value={room.roomNumber} disabled={!room.active}>
                {room.roomNumber} — {room.roomType} · ₹{room.ratePerNight}/night
                {!room.active ? " (inactive)" : known && !isAvailable ? " (booked for these dates)" : ""}
              </option>
            );
          })}
        </Select>
        {checkIn && checkOut && (
          <p className="text-xs mt-1 text-neutral-500">
            {checkingAvailability
              ? "Checking availability…"
              : availableRoomNumbers !== null
                ? `${availableRoomNumbers.size} of ${rooms.filter((r) => r.active).length} rooms available for these dates`
                : null}
          </p>
        )}
        {selectedRoomUnavailable && (
          <p className="text-xs mt-1 text-red-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
            Room {roomNumber} is already booked for an overlapping date range — pick a different room or dates.
          </p>
        )}
      </FormField>

      <FormField label="Payment status" htmlFor="paymentStatus">
        <Select
          id="paymentStatus"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as NonNullable<Booking["paymentStatus"]>)}
        >
          {PAYMENT_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      {nights > 0 && selectedRoom && (
        <div className="text-sm text-neutral-500 font-mono">
          <div className="flex justify-between">
            <span className="font-sans">
              {nights} night{nights > 1 ? "s" : ""} × ₹{ratePerNight.toLocaleString("en-IN")}
            </span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans">GST ({gstRate}%)</span>
            <span>₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between font-semibold text-neutral-900">
            <span className="font-sans">Total (incl. GST)</span>
            <span>₹{estimatedAmount.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-neutral-400 font-sans mt-1">Estimate — final invoice is generated on save.</p>
        </div>
      )}

      <FormField label="Notes (optional)" htmlFor="notes">
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 resize-none"
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Checking in..." : "Check in guest"}
        </Button>
      </div>
    </form>
  );
}
