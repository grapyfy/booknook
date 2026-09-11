// Rebuilt as the real dashboard-home UI (2026-09-08) — the previous version of
// this file was Abhay's backend-verification-only page (real Supabase auth +
// live DB query), explicitly marked in CLAUDE.md as "not meant to be the real
// UI." Per CLAUDE.md's documented UI workflow ("build against mock data first,
// swap to real fetch calls once ready"), this now renders against mock data with
// no Supabase/env dependency, like the other screens under app/(pages)/. It sits
// outside that route group (kept at its existing /dashboard path) because moving
// it would touch/replace a file with real auth wiring — restyled in place instead,
// same as CLAUDE.md's explicit instruction for /login. Real auth-gating (like the
// original version had) should be reconnected here once this plugs into the real
// backend — see STATUS.md.
//
// Visual design (2026-09-08, part 2) follows a hotel-PMS-dashboard reference the
// user provided (stat tiles with icon badges, revenue chart, room-status summary,
// recent-activity list, quick actions) — see context.md for the design system
// this was distilled into. Chart forms follow the dataviz skill: a line for
// revenue-over-time, a stacked bar (not a donut) for room-status part-to-whole.
//
// Minimal/Detailed toggle (2026-09-08, part 4) — Minimal shows only the 4
// headline stats + recent bookings; Detailed adds ADR/RevPAR, the charts,
// arrivals/departures today, and quick actions. Driven by a ?view= search
// param so it stays a plain server-rendered page (shareable/bookmarkable URL,
// no client state needed for something this simple).
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faIndianRupeeSign,
  faUsers,
  faHotel,
  faPlus,
  faRightToBracket,
  faRightFromBracket,
  faDoorOpen,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { AppShell } from "@/components/AppShell";
import { DashboardViewToggle } from "@/components/DashboardViewToggle";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RevenueLineChart } from "@/components/charts/RevenueLineChart";
import { RoomStatusBar } from "@/components/charts/RoomStatusBar";
import { getDashboardStats } from "@/services/dashboardService";

const QUICK_ACTIONS = [
  { label: "New booking", href: "/bookings/new", icon: faPlus },
  { label: "Check in / out", href: "/bookings", icon: faRightToBracket },
  { label: "Add room", href: "/rooms/new", icon: faDoorOpen },
  { label: "Import CSV", href: "/import", icon: faRightFromBracket },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const detailed = view === "detailed";

  const stats = await getDashboardStats();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-neutral-500">Here&apos;s what&apos;s happening at your hotel.</p>
          </div>
          <DashboardViewToggle detailed={detailed} />
        </div>

        <div className={`grid grid-cols-2 gap-4 ${detailed ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-4"}`}>
          <StatCard
            icon={faCalendarCheck}
            label="Bookings (7d)"
            value={String(stats.totalBookings)}
            deltaPct={stats.totalBookingsDeltaPct}
          />
          <StatCard
            icon={faIndianRupeeSign}
            label="Revenue (7d)"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            deltaPct={stats.totalRevenueDeltaPct}
          />
          <StatCard
            icon={faUsers}
            label="Guests (7d)"
            value={String(stats.totalGuests)}
            deltaPct={stats.totalGuestsDeltaPct}
          />
          <StatCard
            icon={faHotel}
            label={`Occupancy (${stats.activeRoomCount} rooms)`}
            value={`${stats.occupancyRate}%`}
          />
          {detailed && (
            <>
              <StatCard icon={faIndianRupeeSign} label="ADR (7d)" value={`₹${stats.adr.toLocaleString("en-IN")}`} />
              <StatCard icon={faChartLine} label="RevPAR (7d)" value={`₹${stats.revPAR.toLocaleString("en-IN")}`} />
            </>
          )}
        </div>

        {detailed && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-medium mb-4">Revenue — last 7 days</h2>
              <RevenueLineChart data={stats.revenueByDay} />
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5 flex flex-col gap-4">
              <h2 className="text-sm font-medium">Room status</h2>
              <RoomStatusBar {...stats.roomStatus} />
            </div>
          </div>
        )}

        {detailed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-medium mb-3">Arrivals today ({stats.arrivalsToday.length})</h2>
              <div className="flex flex-col gap-2">
                {stats.arrivalsToday.length === 0 && <p className="text-sm text-neutral-400">None.</p>}
                {stats.arrivalsToday.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span>
                      {b.guest.name} <span className="text-neutral-400 font-mono">· Room {b.roomNumber}</span>
                    </span>
                    <StatusBadge status={b.status.toLowerCase() as any} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-medium mb-3">Departures today ({stats.departuresToday.length})</h2>
              <div className="flex flex-col gap-2">
                {stats.departuresToday.length === 0 && <p className="text-sm text-neutral-400">None.</p>}
                {stats.departuresToday.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span>
                      {b.guest.name} <span className="text-neutral-400 font-mono">· Room {b.roomNumber}</span>
                    </span>
                    <StatusBadge status={b.status.toLowerCase() as any} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-neutral-500">Recent bookings</h2>
              <Link href="/bookings" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
              {stats.recentBookings.length === 0 && <p className="p-4 text-neutral-500 text-sm">No bookings yet.</p>}
              {stats.recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}/folio`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faDoorOpen} className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-medium">{booking.guest.name}</div>
                      <div className="text-sm text-neutral-500 font-mono">
                        Room {booking.roomNumber} · {new Date(booking.checkIn).toISOString().split("T")[0]}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={booking.status.toLowerCase() as any} />
                </Link>
              ))}
            </div>
          </div>

          {detailed && (
            <div>
              <h2 className="text-sm font-medium text-neutral-500 mb-3">Quick actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col items-center gap-2 text-center hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FontAwesomeIcon icon={action.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
