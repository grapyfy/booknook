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
export async function generateFolio(bookingId: string) {
  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });

  const existing = await db.folio.findUnique({ where: { bookingId } });
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

export async function getFolio(bookingId: string) {
  return db.folio.findUnique({ where: { bookingId } });
}
