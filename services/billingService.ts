import { db } from "@/lib/db";

// GST slabs for hotel accommodation (as of this writing — tax rules change,
// see CLAUDE.md's note on keeping this configurable if the slab structure changes).
// Based on the room's per-night rate, NOT the total booking amount.
const GST_LOW_RATE = 12; // ₹1,000–₹7,500 per night
const GST_HIGH_RATE = 18; // above ₹7,500 per night
const GST_THRESHOLD = 7500;
const SAC_CODE_ACCOMMODATION = "996311";

function gstRateForRoomRate(roomRatePerNight: number): number {
  return roomRatePerNight > GST_THRESHOLD ? GST_HIGH_RATE : GST_LOW_RATE;
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
  const gstRate = gstRateForRoomRate(booking.roomRatePerNight);
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
