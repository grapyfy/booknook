import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { listBookings } from "@/services/bookingService";
import { listRooms } from "@/services/roomService";
import { Button } from "@/components/ui/Button";
import { BookingsViewToggle } from "@/components/BookingsViewToggle";
import { CalendarGrid } from "@/components/CalendarGrid";

const RANGE_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

export default async function BookingsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; range?: string }>;
}) {
  const { start: startParam, range: rangeParam } = await searchParams;
  const range = rangeParam && RANGE_DAYS[rangeParam] ? rangeParam : "week";
  const visibleDays = RANGE_DAYS[range];
  const startDate = startParam ? new Date(startParam) : new Date();
  const days = dateRange(startDate, visibleDays);

  const shiftDays = visibleDays;
  const prevStart = toISODate(new Date(new Date(startDate).setDate(startDate.getDate() - shiftDays)));
  const nextStart = toISODate(new Date(new Date(startDate).setDate(startDate.getDate() + shiftDays)));

  const bookings = await listBookings();
  const rooms = await listRooms();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Bookings</h1>
          <BookingsViewToggle active="calendar" />
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/bookings/calendar?start=${prevStart}&range=${range}`}>
            <Button variant="secondary">
              <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
            </Button>
          </Link>
          <span className="text-sm text-neutral-500 font-mono">
            {days[0]} → {days[days.length - 1]}
          </span>
          <Link href={`/bookings/calendar?start=${nextStart}&range=${range}`}>
            <Button variant="secondary">
              <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
          {(["day", "week", "month"] as const).map((r) => (
            <Link
              key={r}
              href={`/bookings/calendar?start=${toISODate(startDate)}&range=${r}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                range === r ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      <CalendarGrid rooms={rooms} bookings={bookings} days={days} />

      <p className="text-xs text-neutral-400">Click a cell to view its folio. Drag a booking to move it to a different room or date.</p>
    </div>
  );
}
