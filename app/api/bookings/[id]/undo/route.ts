import { NextRequest, NextResponse } from "next/server";
import { undoBookingStatus } from "@/services/bookingService";
import { requireStaff } from "@/lib/require-staff";
import { logAction } from "@/services/auditLogService";

// Separate route from PATCH .../status on purpose — undo is a distinct, narrower
// action (one step back, blocked once a folio exists), not a general status
// transition, and the audit log should be able to tell "staff reverted a mis-click"
// apart from "staff moved the booking forward in its normal lifecycle."
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const booking = await undoBookingStatus(id);
    await logAction({ staffId: auth.staff.id, action: "booking.undo_status", entityType: "Booking", entityId: id, details: { revertedTo: booking.status } });
    return NextResponse.json(booking);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not undo booking status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
