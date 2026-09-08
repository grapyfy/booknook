import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { getBookingMock, generateFolioMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";

export default async function FolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = getBookingMock(id);
  if (!booking) notFound();

  // Same idempotent generate-or-fetch pattern as the real
  // POST /api/bookings/:id/folio — safe to land on this page repeatedly.
  const folio = generateFolioMock(id);

  const whatsappPreview = `Hi ${booking.guest.name}, your booking at BookNook is confirmed!\nRoom ${booking.roomNumber} · ${booking.checkIn} to ${booking.checkOut}\nTotal: ₹${folio.totalAmount.toLocaleString("en-IN")} (incl. GST)\nInvoice: ${folio.invoiceNumber}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">
          Folio — <span className="font-mono">{folio.invoiceNumber}</span>
        </h1>
        <p className="text-sm text-neutral-500 font-mono">
          {booking.guest.name} · Room {booking.roomNumber} · {booking.checkIn} → {booking.checkOut}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-4">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>SAC Code</span>
          <span className="font-mono">{folio.sacCode}</span>
        </div>
        <div className="border-t border-neutral-100 pt-4 flex flex-col gap-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="font-sans">Room charges</span>
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
          <span>Total</span>
          <span className="font-mono">₹{folio.totalAmount.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-xs text-neutral-400">
          Mock GST calculation for preview — the real amount is always computed server-side (see
          services/billingService.ts).
        </p>
      </div>

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
