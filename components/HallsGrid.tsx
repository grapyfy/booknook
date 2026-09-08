import Link from "next/link";
import type { Venue, HallEvent } from "@/components/lib/hallsMock";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8:00-19:00

const STATUS_STYLES: Record<HallEvent["status"], string> = {
  confirmed: "bg-amber-100 text-amber-800 border-amber-200",
  "in-progress": "bg-green-100 text-green-800 border-green-200",
  hold: "bg-blue-50 text-blue-700 border-blue-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

function nextDays(anchor: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function HallsGrid({ venues, events, date }: { venues: Venue[]; events: HallEvent[]; date: string }) {
  const days = nextDays("2026-09-07", 7);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto">
        {days.map((d) => {
          const label = new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
          const active = d === date;
          return (
            <Link
              key={d}
              href={`/halls?date=${d}`}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
                active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-4 py-3 text-left font-medium text-neutral-500 border-b border-r border-neutral-200 z-10 min-w-[160px]">
                Venue
              </th>
              {HOURS.map((h) => (
                <th key={h} className="px-2 py-3 text-center font-mono font-medium text-neutral-500 border-b border-neutral-200 min-w-[64px]">
                  {String(h).padStart(2, "0")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id}>
                <td className="sticky left-0 bg-white px-4 py-2 border-r border-b border-neutral-100 z-10">
                  <div className="font-medium">{venue.name}</div>
                  <div className="text-xs text-neutral-400">
                    Cap. {venue.capacity} · {venue.floor}
                  </div>
                </td>
                {HOURS.map((h) => {
                  const event = events.find((e) => e.venueId === venue.id && h >= e.startHour && h < e.endHour);
                  const isStart = event && event.startHour === h;
                  return (
                    <td key={h} className="p-1 border-b border-neutral-100 relative">
                      {isStart && event && (
                        <div
                          className={`absolute inset-y-1 left-1 rounded px-2 py-1 text-xs border truncate ${STATUS_STYLES[event.status]}`}
                          style={{ width: `${(event.endHour - event.startHour) * 64 - 8}px` }}
                          title={`${event.host} · ${event.purpose}`}
                        >
                          {event.host} · {event.purpose}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs text-neutral-500">
        {Object.entries(STATUS_STYLES).map(([status, style]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border ${style}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
