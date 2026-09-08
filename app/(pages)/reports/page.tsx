import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { getDashboardStatsMock, listBookingsMock } from "@/components/lib/mockData";
import { Button } from "@/components/ui/Button";
import { ExportCsvButton } from "@/components/ExportCsvButton";

export default function ReportsPage() {
  const stats = getDashboardStatsMock();
  const bookings = listBookingsMock();

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
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-3 gap-4">
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
      </div>

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
    </div>
  );
}
