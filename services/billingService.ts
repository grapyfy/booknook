import { db } from "@/lib/db";
import { getPropertySettings } from "@/services/settingsService";
import { gstRateForRoomRate, type GstConfig } from "@/lib/gst";

export type { GstConfig };

const SAC_CODE_ACCOMMODATION = "996311";

// Reads the configured slab from PropertySettings instead of a hardcoded constant —
// these three numbers are government-notified (CBIC), not a business choice, so
// "configurable" here means an owner can update them when the LAW changes (it has
// before), not set an arbitrary rate. See the schema comment on PropertySettings.
// Exported so the booking form's live tax-inclusive estimate can use the same real
// config instead of a second hardcoded copy that could drift from this one.
export async function getGstConfig(): Promise<GstConfig> {
  const settings = await getPropertySettings();
  return {
    thresholdRupees: settings.gstThresholdRupees,
    lowRatePercent: settings.gstLowRatePercent,
    highRatePercent: settings.gstHighRatePercent,
  };
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.folio.count();
  return `BN-${year}-${String(count + 1).padStart(5, "0")}`;
}

// v1 assumes every guest is intra-state (CGST+SGST) — inter-state (IGST) needs the
// guest's billing state, which isn't captured yet. Deferred; see CLAUDE.md v1 scope.
//
// Idempotency changed shape 2026-09-24: Folio.bookingId is no longer @unique (see
// the schema comment on Booking.folios) — "the folio for this booking" is now "the
// latest NON-VOIDED folio for this booking", found with findFirst + ordering, not
// a unique-constraint lookup. Voiding one and landing on this page again correctly
// generates a fresh one instead of either erroring or resurrecting the voided row.
export async function generateFolio(bookingId: string) {
  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });

  const existing = await db.folio.findFirst({ where: { bookingId, voided: false }, orderBy: { createdAt: "desc" } });
  if (existing) return existing; // idempotent — never double-bill the same booking

  const baseAmount = booking.amount;
  const gstConfig = await getGstConfig();
  const gstRate = gstRateForRoomRate(booking.roomRatePerNight, gstConfig);
  const taxAmount = Math.round((baseAmount * gstRate) / 100);
  const cgst = Math.round(taxAmount / 2);
  const sgst = taxAmount - cgst; // avoids a rupee going missing to rounding

  return db.folio.create({
    data: {
      bookingId,
      invoiceNumber: await nextInvoiceNumber(),
      sacCode: SAC_CODE_ACCOMMODATION,
      baseAmount,
      gstRate,
      gstType: "CGST_SGST",
      cgst,
      sgst,
      igst: 0,
      totalAmount: baseAmount + taxAmount,
    },
  });
}

// The current (latest non-voided) folio, or null if none has been generated yet.
export async function getFolio(bookingId: string) {
  return db.folio.findFirst({ where: { bookingId, voided: false }, orderBy: { createdAt: "desc" } });
}

// Every folio ever issued for this booking, newest first — including voided ones,
// so the folio page can show void history (invoice number + reason) as an audit
// trail, same as the mock layer already did.
export async function listFoliosForBooking(bookingId: string) {
  return db.folio.findMany({ where: { bookingId }, orderBy: { createdAt: "desc" } });
}

// A voided invoice stays in the table (GST law requires an invoice number to never
// just vanish) — this only flips the flag. The next generateFolio() call for the
// same booking correctly creates a fresh one, since the voided row no longer
// satisfies the "latest non-voided" lookup above.
export async function voidFolio(folioId: string, reason: string) {
  const folio = await db.folio.findUniqueOrThrow({ where: { id: folioId } });
  if (folio.voided) throw new Error("This invoice is already voided");
  return db.folio.update({ where: { id: folioId }, data: { voided: true, voidReason: reason } });
}

// Every active (non-voided) invoice, for the GSTR-1 CSV export — voided rows are
// correctly excluded, since they were superseded and would double-count outward
// supply if included alongside their replacement.
export async function listActiveFolios() {
  return db.folio.findMany({ where: { voided: false }, orderBy: { createdAt: "asc" } });
}
