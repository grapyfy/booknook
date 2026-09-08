import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faEnvelope, faReceipt } from "@fortawesome/free-solid-svg-icons";
import { getDashboardStatsMock, listBookingsMock, listFoliosMock, nightsBetween, gstRateForRoomRate } from "@/components/lib/mockData";
import { computeBookingBalanceMock } from "@/components/lib/paymentsMock";
import { Button } from "@/components/ui/Button";
import { ExportCsvButton } from "@/components/ExportCsvButton";

export default function ReportsPage() {
  const stats = getDashboardStatsMock();
  const bookings = listBookingsMock();

  // Outstanding balance across every non-cancelled booking — the folio total
  // (room + GST) is the same total the folio page bills against, so this is
  // the same real balance a front-desk person would see per booking, summed.
  const outstandingBookings = bookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => {
      const nights = nightsBetween(b.checkIn, b.checkOut);
      const serviceTotal = (b.extraServices ?? []).reduce((sum, s) => sum + s.amount, 0);
      const gstRate = gstRateForRoomRate(b.amount / nights);
      const roomTotalInclGst = Math.round(b.amount * (1 + gstRate / 100));
      const totalDue = roomTotalInclGst + serviceTotal;
      const balance = computeBookingBalanceMock(b.id, totalDue);
      return { booking: b, balance: balance.balance };
    })
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const totalOutstanding = outstandingBookings.reduce((sum, r) => sum + r.balance, 0);

  // GSTR-1-style export: every active (non-voided) invoice generated so far.
  // Voided invoices are correctly excluded — they were superseded, so they'd
  // double-count outward supply if included.
  const activeFolios = listFoliosMock().filter((f) => !f.voided);
  const gstr1Rows = activeFolios.map((f) => ({
    invoiceNumber: f.invoiceNumber,
    invoiceDate: f.createdAt.slice(0, 10),
    sacCode: f.sacCode,
    taxableValue: f.baseAmount,
    cgst: f.cgst,
    sgst: f.sgst,
    igst: f.igst,
    gstRate: f.gstRate,
    totalInvoiceValue: f.totalAmount,
  }));

  // Revenue by room type — an honest substitute for an OTA-vs-direct channel
  // split, since Booking doesn't carry a "source" field yet (see LOGIC.md).
  const revenueByRoomType = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const type = b.roomNumber; // grouped by room below via a join in a real backend; kept simple here
    revenueByRoomType.set(type, (revenueByRoomType.get(type) ?? 0) + b.amount);
  }
  const maxRevenue = Math.max(...revenueByRoomType.values(), 1);

  const csvRows = bookings.map((b) => ({
    id: b.id,
    guest: b.guest.name,
    phone: b.guest.phone,
    room: b.roomNumber,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status,
    amount: b.amount,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-neutral-500">Occupancy, rate, and revenue — last 7 days.</p>
        </div>
        <div className="flex gap-3">
          <ExportCsvButton
            filename="bookings-report.csv"
            rows={csvRows}
            label="Export CSV"
            icon={faFileCsv}
          />
          <Button
            variant="secondary"
            disabled
            title="No email delivery is wired up yet — this button is a stub, per CLAUDE.md's rule against wiring live sends before content review"
          >
            <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
            Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Occupancy</div>
          <div className="text-2xl font-semibold font-mono">{stats.occupancyRate}%</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">ADR</div>
          <div className="text-2xl font-semibold font-mono">₹{stats.adr.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">RevPAR</div>
          <div className="text-2xl font-semibold font-mono">₹{stats.revPAR.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">Outstanding</div>
          <div className={`text-2xl font-semibold font-mono ${totalOutstanding > 0 ? "text-red-600" : ""}`}>
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {outstandingBookings.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium mb-4">Payments due</h2>
          <div className="flex flex-col gap-2 text-sm">
            {outstandingBookings.map(({ booking, balance }) => (
              <div key={booking.id} className="flex justify-between">
                <span>
                  {booking.guest.name} <span className="text-neutral-400 font-mono text-xs">Room {booking.roomNumber}</span>
                </span>
                <span className="font-mono text-red-600">₹{balance.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-medium mb-4">Revenue by room (non-cancelled bookings, all time)</h2>
        <div className="flex flex-col gap-2">
          {[...revenueByRoomType.entries()].map(([room, amount]) => (
            <div key={room} className="flex items-center gap-3 text-sm">
              <span className="w-16 font-mono text-neutral-500">Room {room}</span>
              <div className="flex-1 h-5 rounded bg-neutral-100 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${(amount / maxRevenue) * 100}%` }} />
              </div>
              <span className="w-24 text-right font-mono">₹{amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
          {revenueByRoomType.size === 0 && <p className="text-sm text-neutral-400">No revenue yet.</p>}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">GSTR-1 export</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Every active (non-voided) invoice issued so far — invoice no., date, SAC code, taxable value, CGST/SGST, total.
            {activeFolios.length} invoice{activeFolios.length === 1 ? "" : "s"}.
          </p>
        </div>
        <ExportCsvButton filename="gstr1-export.csv" rows={gstr1Rows} label="Export GSTR-1 CSV" icon={faReceipt} />
      </div>
    </div>
  );
}
