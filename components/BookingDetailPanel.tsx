"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPhone, faFileInvoice, faNoteSticky } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { nightsBetween } from "@/lib/dates";
import type { Booking } from "@/types/booking";

const PAYMENT_STATUS_STYLES: Record<NonNullable<Booking["paymentStatus"]>, string> = {
  prepaid: "bg-green-100 text-green-700",
  postpaid: "bg-neutral-100 text-neutral-600",
  partial: "bg-amber-100 text-amber-700",
};

const PAYMENT_STATUS_LABELS: Record<NonNullable<Booking["paymentStatus"]>, string> = {
  prepaid: "Prepaid",
  postpaid: "Postpaid (pay at checkout)",
  partial: "Partially paid",
};

export function BookingDetailPanel({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const perNight = Math.round(booking.amount / nights);
  const serviceTotal = (booking.extraServices ?? []).reduce((sum, s) => sum + s.amount, 0);
  const grandTotal = booking.amount + serviceTotal;
  const paymentStatus = booking.paymentStatus ?? "postpaid";

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-end bg-black/20" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto flex flex-col gap-5 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{booking.guest.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500 font-mono mt-0.5">
              <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
              {booking.guest.phone}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={booking.status} />
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_STATUS_STYLES[paymentStatus]}`}>
            {PAYMENT_STATUS_LABELS[paymentStatus]}
          </span>
          {booking.groupName && (
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-700">{booking.groupName}</span>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Room</span>
            <span className="font-mono font-medium">{booking.roomNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Check-in → Check-out</span>
            <span className="font-mono">
              {booking.checkIn} → {booking.checkOut}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Nights</span>
            <span className="font-mono">{nights}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Rate</span>
            <span className="font-mono">₹{perNight.toLocaleString("en-IN")} / night</span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Room charges</span>
            <span className="font-mono">₹{booking.amount.toLocaleString("en-IN")}</span>
          </div>
          {booking.discountAmount ? (
            <div className="flex justify-between text-red-600 text-xs">
              <span>Discount already applied</span>
              <span className="font-mono">-₹{booking.discountAmount.toLocaleString("en-IN")}</span>
            </div>
          ) : null}
          {(booking.extraServices ?? []).map((s, i) => (
            <div key={i} className="flex justify-between text-neutral-500">
              <span>{s.name}</span>
              <span className="font-mono">₹{s.amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
          {(booking.extraServices ?? []).length === 0 && <div className="text-neutral-400 text-xs">No additional services on this stay.</div>}
          <div className="flex justify-between border-t border-neutral-100 pt-2 font-medium">
            <span>Total</span>
            <span className="font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
          {serviceTotal > 0 && (
            <p className="text-xs text-neutral-400">
              Service charges are shown here for reference — they don&apos;t flow into the GST folio yet (billing-depth phase).
            </p>
          )}
        </div>

        {booking.notes && (
          <div className="rounded-lg border border-neutral-200 p-4 flex items-start gap-2.5 text-sm">
            <FontAwesomeIcon icon={faNoteSticky} className="h-3.5 w-3.5 mt-0.5 text-neutral-400 shrink-0" />
            <span className="text-neutral-600">{booking.notes}</span>
          </div>
        )}

        {booking.priceNote && (
          <p className="text-xs text-neutral-500">
            <span className="font-medium">Pricing note:</span> {booking.priceNote}
          </p>
        )}

        <Link href={`/bookings/${booking.id}/folio`} className="mt-auto">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <FontAwesomeIcon icon={faFileInvoice} className="h-3.5 w-3.5" />
            View full folio
          </button>
        </Link>
      </div>
    </div>
  );
}
