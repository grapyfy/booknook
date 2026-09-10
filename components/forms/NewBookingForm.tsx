"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faLock, faLockOpen, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { createBookingAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/types/room";
import type { Guest, Booking } from "@/types/booking";

const ID_TYPE_LABELS: Record<NonNullable<Guest["idType"]>, string> = {
  aadhaar: "Aadhaar",
  passport: "Passport",
  driving_license: "Driving licence",
  voter_id: "Voter ID",
  other: "Other",
};

const PAYMENT_STATUS_OPTIONS: { value: NonNullable<Booking["paymentStatus"]>; label: string }[] = [
  { value: "postpaid", label: "Postpaid — pay at checkout" },
  { value: "prepaid", label: "Prepaid — already paid in full" },
  { value: "partial", label: "Partially paid" },
];

interface ServiceRow {
  name: string;
  amount: string;
}

interface GstConfig {
  thresholdRupees: number;
  lowRatePercent: number;
  highRatePercent: number;
}

export function NewBookingForm({ rooms, gstConfig }: { rooms: Room[]; gstConfig: GstConfig }) {
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

  const [overrideRate, setOverrideRate] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discount, setDiscount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<NonNullable<Booking["paymentStatus"]>>("postpaid");
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [priceNote, setPriceNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // null = haven't checked yet (no dates picked, or the check is still in flight) —
  // treated as "don't know," never as "unavailable." Fails open on a network error
  // (same philosophy as lib/rate-limit.ts): if we can't tell, don't block the user,
  // just don't show the availability hint. createBooking still independently
  // re-checks server-side regardless of what this shows.
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

  const listRate = selectedRoom?.ratePerNight ?? 0;
  const effectiveRate = overrideRate && Number(customRate) > 0 ? Number(customRate) : listRate;
  const subtotal = effectiveRate * nights;
  // Discount can be entered as a flat ₹ or a % — converted to a flat ₹ amount here
  // before it's ever sent anywhere, so createBookingAction's discountAmount field
  // (and the server's clamp-to-subtotal logic) don't need to know which was used.
  const discountRaw = discountType === "percent" ? (subtotal * (Number(discount) || 0)) / 100 : Number(discount) || 0;
  const discountValue = Math.min(Math.max(discountRaw, 0), subtotal);
  const servicesTotal = services.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  // Client-side preview only — the server (billingService.generateFolio) always
  // recomputes this from the booking's actual stored amount using the same
  // real, configured GST slab (never a hardcoded duplicate — see gstConfig prop).
  // Never trust this number; it's just so front desk sees a real tax-inclusive
  // total before saving, matching what the folio will actually show.
  const roomTotal = subtotal - discountValue;
  const gstRate = effectiveRate > gstConfig.thresholdRupees ? gstConfig.highRatePercent : gstConfig.lowRatePercent;
  const gstAmount = Math.round((roomTotal * gstRate) / 100);
  const roomTotalWithTax = roomTotal + gstAmount;
  // Extra services aren't run through GST in the real invoice yet (billing-depth
  // phase, see BACKEND_LOGIC.md) — matching that here rather than implying they are.
  const grandTotal = roomTotalWithTax + servicesTotal;

  function updateService(i: number, patch: Partial<ServiceRow>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addService() {
    setServices((prev) => [...prev, { name: "", amount: "" }]);
  }
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

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
      rateOverride: overrideRate && Number(customRate) > 0 ? Number(customRate) : undefined,
      discountAmount: discountValue > 0 ? Math.round(discountValue) : undefined,
      extraServices: services
        .filter((s) => s.name.trim() && Number(s.amount) > 0)
        .map((s) => ({ name: s.name.trim(), amount: Number(s.amount) })),
      paymentStatus,
      priceNote: priceNote || undefined,
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

      {/* Pricing control — full override on rate + discount + add-on services.
          Everything here is a proposal the server re-derives the amount from,
          never a final total accepted as-is (see createBookingMock). */}
      <div className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Pricing</span>
          <button
            type="button"
            onClick={() => {
              setOverrideRate((v) => !v);
              if (!overrideRate) setCustomRate(String(listRate || ""));
            }}
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
              overrideRate ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            <FontAwesomeIcon icon={overrideRate ? faLockOpen : faLock} className="h-3 w-3" />
            {overrideRate ? "Custom rate" : "List rate"}
          </button>
        </div>

        {overrideRate ? (
          <FormField label={`Rate per night (list price ₹${listRate.toLocaleString("en-IN")})`} htmlFor="customRate">
            <Input
              id="customRate"
              type="number"
              min={1}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              placeholder="Negotiated / corporate rate"
            />
          </FormField>
        ) : (
          <p className="text-sm text-neutral-500">
            ₹{listRate.toLocaleString("en-IN")}/night (this room&apos;s list rate)
          </p>
        )}

        <FormField label="Discount (optional)" htmlFor="discount">
          <div className="flex gap-2">
            <Select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "flat" | "percent")}
              className="w-28 shrink-0"
            >
              <option value="flat">₹ Flat</option>
              <option value="percent">% Percent</option>
            </Select>
            <Input
              id="discount"
              type="number"
              min={0}
              max={discountType === "percent" ? 100 : undefined}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 300"}
            />
          </div>
          {discountType === "percent" && discountValue > 0 && (
            <p className="text-xs text-neutral-500 mt-1">= ₹{Math.round(discountValue).toLocaleString("en-IN")} off</p>
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

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">Additional services (optional)</span>
          {services.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="e.g. Airport pickup"
                value={s.name}
                onChange={(e) => updateService(i, { name: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                placeholder="₹"
                value={s.amount}
                onChange={(e) => updateService(i, { amount: e.target.value })}
                className="w-28"
              />
              <button type="button" onClick={() => removeService(i)} className="text-neutral-400 hover:text-red-600">
                <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addService} className="self-start inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            Add a service charge
          </button>
        </div>

        {overrideRate && (
          <FormField label="Note (why the rate/discount was changed, optional)" htmlFor="priceNote">
            <Input id="priceNote" value={priceNote} onChange={(e) => setPriceNote(e.target.value)} placeholder="e.g. Corporate rate agreed by GM" />
          </FormField>
        )}

        {nights > 0 && effectiveRate > 0 && (
          <div className="border-t border-neutral-100 pt-3 flex flex-col gap-1 text-sm font-mono">
            <div className="flex justify-between text-neutral-500">
              <span className="font-sans">
                {nights} night{nights > 1 ? "s" : ""} × ₹{effectiveRate.toLocaleString("en-IN")}
              </span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="font-sans">Discount</span>
                <span>-₹{discountValue.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span className="font-sans">GST ({gstRate}%)</span>
              <span>₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span className="font-sans">Room total (incl. GST)</span>
              <span>₹{roomTotalWithTax.toLocaleString("en-IN")}</span>
            </div>
            {servicesTotal > 0 && (
              <div className="flex justify-between text-neutral-500">
                <span className="font-sans">Services (not GST'd yet)</span>
                <span>₹{servicesTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-100 pt-1 mt-1">
              <span className="font-sans">Estimated total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-neutral-400 font-sans">
              Estimate using the hotel&apos;s configured GST slab — the final invoice is generated on save.
            </p>
          </div>
        )}
      </div>

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
          {submitting ? "Saving..." : "Create booking & generate invoice"}
        </Button>
      </div>
    </form>
  );
}
