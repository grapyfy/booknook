import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileInvoice, faCalendarXmark, faTriangleExclamation, faNoteSticky } from "@fortawesome/free-solid-svg-icons";
import { listBookings, findOverbookingConflicts, findPossibleNoShows } from "@/services/bookingService";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { BookingsViewToggle } from "@/components/BookingsViewToggle";
import { BookingRowActions } from "@/components/forms/BookingRowActions";
import type { Booking } from "@/types/booking";

const STATUS_OPTIONS: { value: "all" | Booking["status"]; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "checked-in", label: "Checked-in" },
  { value: "checked-out", label: "Checked-out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No-show" },
];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = STATUS_OPTIONS.some((o) => o.value === statusParam) ? (statusParam as (typeof STATUS_OPTIONS)[number]["value"]) : "all";

  const allBookings = await listBookings();
  const bookings = status === "all" ? allBookings : allBookings.filter((b) => b.status === status);

  const [overbookingConflicts, possibleNoShows] = await Promise.all([
    findOverbookingConflicts(),
    findPossibleNoShows(),
  ]);
  const bookingById = new Map(allBookings.map((b) => [b.id, b]));
  // findOverbookingConflicts returns bookingIds (not full booking objects) —
  // resolve them against the bookings we already fetched.
  const conflicts = overbookingConflicts
    .map((c) => ({
      roomNumber: c.roomNumber,
      a: bookingById.get(c.bookingIds[0]),
      b: bookingById.get(c.bookingIds[1]),
    }))
    .filter((c): c is { roomNumber: string; a: Booking; b: Booking } => !!c.a && !!c.b);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Bookings</h1>
          <BookingsViewToggle active="list" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/bookings/walk-in">
            <Button variant="secondary">Walk-in</Button>
          </Link>
          <Link href="/bookings/new">
            <Button>
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
              New booking
            </Button>
          </Link>
        </div>
      </div>

      {(conflicts.length > 0 || possibleNoShows.length > 0) && (
        <div className="flex flex-col gap-2">
          {conflicts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <div>
                <span className="font-medium">{conflicts.length} overbooking conflict{conflicts.length > 1 ? "s" : ""}.</span>{" "}
                {conflicts.map((c, i) => (
                  <span key={i}>
                    Room {c.roomNumber}: {c.a.guest.name} ({c.a.checkIn}→{c.a.checkOut}) overlaps {c.b.guest.name} ({c.b.checkIn}→{c.b.checkOut}).{" "}
                  </span>
                ))}
                Move one booking (drag it on the calendar) to resolve.
              </div>
            </div>
          )}
          {possibleNoShows.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 text-orange-800 px-4 py-3 text-sm flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
              <div>
                <span className="font-medium">{possibleNoShows.length} possible no-show{possibleNoShows.length > 1 ? "s" : ""}.</span>{" "}
                Confirmed booking{possibleNoShows.length > 1 ? "s" : ""} whose check-in date has passed:{" "}
                {possibleNoShows.map((b) => b.guest.name).join(", ")}. Mark as no-show below if the guest never arrived.
              </div>
            </div>
          )}
        </div>
      )}

      <form method="GET" className="flex items-center gap-2">
        <Select name="status" defaultValue={status} className="max-w-[180px]">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Check-in</th>
              <th className="px-4 py-3 font-medium">Check-out</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                  <div className="flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarXmark} className="h-6 w-6 text-neutral-300" />
                    <div>No bookings match this filter.</div>
                  </div>
                </td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/bookings/${booking.id}/guest`} className="font-medium hover:underline">
                      {booking.guest.name}
                    </Link>
                    {booking.notes && (
                      <FontAwesomeIcon icon={faNoteSticky} className="h-3 w-3 text-neutral-400" title={booking.notes} />
                    )}
                    {booking.groupName && (
                      <span className="text-xs text-neutral-400 font-normal">({booking.groupName})</span>
                    )}
                  </div>
                  <div className="text-neutral-500 font-mono text-xs">{booking.guest.phone}</div>
                </td>
                <td className="px-4 py-3 font-mono">{booking.roomNumber}</td>
                <td className="px-4 py-3 font-mono">{booking.checkIn}</td>
                <td className="px-4 py-3 font-mono">{booking.checkOut}</td>
                <td className="px-4 py-3 font-mono">₹{booking.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <BookingRowActions id={booking.id} status={booking.status} checkOut={booking.checkOut} />
                    <Link
                      href={`/bookings/${booking.id}/folio`}
                      className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900"
                      title="View GST folio / invoice"
                    >
                      <FontAwesomeIcon icon={faFileInvoice} className="h-3.5 w-3.5" />
                      Folio
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
