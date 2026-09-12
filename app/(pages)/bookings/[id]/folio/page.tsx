import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { getBooking } from "@/services/bookingService";
import { generateFolio } from "@/services/billingService";
import { listPaymentsForBookingMock, listCreditNotesForBookingMock, computeBookingBalanceMock } from "@/components/lib/paymentsMock";
import { listFoliosMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";
import { PaymentPanel } from "@/components/PaymentPanel";
import { nightsBetween } from "@/lib/dates";
import type { Booking, Folio } from "@/types/booking";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  prepaid: "bg-green-100 text-green-700",
  postpaid: "bg-neutral-100 text-neutral-600",
  partial: "bg-amber-100 text-amber-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  prepaid: "Prepaid",
  postpaid: "Postpaid — pay at checkout",
  partial: "Partially paid",
};

export default async function FolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = (await getBooking(id)) as Booking | null;
  if (!booking) notFound();

  // Idempotent generate-or-fetch — safe to land on this page repeatedly.
  // Cast to the shared Folio contract: the real billingService doesn't have
  // voided/voidReason yet (billing-depth backend not built, see CLAUDE.md) —
  // both stay undefined until that work lands, which is what the contract expects.
  const folio = (await generateFolio(id)) as unknown as Folio;

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const perNightRate = Math.round(booking.amount / nights);
  const serviceTotal = (booking.extraServices ?? []).reduce((sum: number, s: { amount: number }) => sum + s.amount, 0);
  const grandTotal = folio.totalAmount + serviceTotal;
  const paymentStatus = booking.paymentStatus ?? "postpaid";

  const payments = listPaymentsForBookingMock(booking.id);
  const creditNotes = listCreditNotesForBookingMock(booking.id);
  const balance = computeBookingBalanceMock(booking.id, grandTotal);
  const voidedFolios = listFoliosMock().filter((f) => f.bookingId === booking.id && f.voided);

  const whatsappPreview = `Hi ${booking.guest.name}, your booking at GRAP is confirmed!\nRoom ${booking.roomNumber} · ${booking.checkIn} to ${booking.checkOut}\nTotal: ₹${folio.totalAmount.toLocaleString("en-IN")} (incl. GST)\nInvoice: ${folio.invoiceNumber}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">
          Folio — <span className="font-mono">{folio.invoiceNumber}</span>
        </h1>
        <p className="text-sm text-neutral-500 font-mono">
          {booking.guest.name} · Room {booking.roomNumber} · {booking.checkIn} → {booking.checkOut} · {nights} night
          {nights > 1 ? "s" : ""}
        </p>
        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_STATUS_STYLES[paymentStatus]}`}>
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </span>
        {voidedFolios.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-xs flex flex-col gap-1">
            {voidedFolios.map((f) => (
              <div key={f.id}>
                Voided invoice <span className="font-mono">{f.invoiceNumber}</span>: {f.voidReason}
              </div>
            ))}
            <div>This is a new invoice, issued after the one(s) above were voided.</div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>SAC Code</span>
          <span className="font-mono">{folio.sacCode}</span>
        </div>
        <div className="border-t border-neutral-100 pt-4 flex flex-col gap-2 text-sm font-mono">
          <div className="flex justify-between text-neutral-500">
            <span className="font-sans">Rate charged</span>
            <span>
              ₹{perNightRate.toLocaleString("en-IN")}/night × {nights}
            </span>
          </div>
          {booking.discountAmount ? (
            <div className="flex justify-between text-red-600">
              <span className="font-sans">Discount applied</span>
              <span>-₹{booking.discountAmount.toLocaleString("en-IN")}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="font-sans">Room charges (after discount)</span>
            <span>₹{folio.baseAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span className="font-sans">CGST ({folio.gstRate / 2}%)</span>
            <span>₹{folio.cgst.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span className="font-sans">SGST ({folio.gstRate / 2}%)</span>
            <span>₹{folio.sgst.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-4 flex justify-between text-base font-semibold">
          <span>Room total (incl. GST)</span>
          <span className="font-mono">₹{folio.totalAmount.toLocaleString("en-IN")}</span>
        </div>
        {booking.priceNote && (
          <p className="text-xs text-neutral-500 border-t border-neutral-100 pt-3">
            <span className="font-medium">Pricing note:</span> {booking.priceNote}
          </p>
        )}
        <p className="text-xs text-neutral-400">
          Mock GST calculation for preview — the real amount is always computed server-side (see
          services/billingService.ts). GST slab is based on the actual per-night rate charged, not the room&apos;s
          list rate.
        </p>
      </div>

      <PaymentPanel bookingId={booking.id} balance={balance} payments={payments} creditNotes={creditNotes} folioVoided={!!folio.voided} />

      {(booking.extraServices ?? []).length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-3">
          <div className="font-medium text-sm">Additional services</div>
          <div className="flex flex-col gap-2 text-sm font-mono">
            {booking.extraServices!.map((s, i) => (
              <div key={i} className="flex justify-between text-neutral-600">
                <span className="font-sans">{s.name}</span>
                <span>₹{s.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-200 pt-3 flex justify-between text-base font-semibold">
            <span>Grand total (room + services)</span>
            <span className="font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-neutral-400">
            Service charges are shown for reference — not yet run through GST in this invoice (billing-depth phase).
          </p>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex items-center justify-between">
        <div>
          <div className="font-medium">Collect payment via UPI</div>
          <div className="text-sm text-neutral-500">Uses this hotel&apos;s own Razorpay account (BYOG)</div>
        </div>
        <Button disabled title="Stub — real Razorpay checkout wires in once a hotel connects its account">
          <FontAwesomeIcon icon={faIndianRupeeSign} className="h-3.5 w-3.5" />
          Pay via UPI
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 font-medium">
          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-green-600" />
          WhatsApp confirmation — preview only
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-neutral-50 rounded-lg p-3 border border-neutral-100">
          {whatsappPreview}
        </pre>
        <p className="text-xs text-neutral-400">
          This is never actually sent — per CLAUDE.md, live WhatsApp sends stay gated until the message content is
          explicitly reviewed.
        </p>
      </div>
    </div>
  );
}
