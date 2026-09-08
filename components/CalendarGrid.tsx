"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BookingDetailPanel } from "@/components/BookingDetailPanel";
import { rescheduleBookingAction } from "@/components/lib/actions";
import type { Booking } from "@/types/booking";
import type { Room } from "@/types/room";

// Bold, saturated bars on purpose — this is a Gantt-style timeline read at a
// glance across many rooms/days, so it needs more visual weight than the soft
// status pills used in tables/detail pages elsewhere (StatusBadge). Intentional
// deviation, not a consistency slip — see context.md.
const STATUS_BAR_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-blue-600 text-white",
  "checked-in": "bg-green-600 text-white",
  "checked-out": "bg-neutral-300 text-neutral-600",
  cancelled: "bg-red-200 text-red-700 line-through opacity-70",
  waitlisted: "bg-amber-500 text-white",
  "no-show": "bg-orange-600 text-white",
};

// A booking can only be dragged to a new room/date while it's still "live" —
// a checked-out/cancelled/no-show stay is history, not something to reschedule.
const DRAGGABLE_STATUSES: Booking["status"][] = ["confirmed", "checked-in", "waitlisted"];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface Segment {
  date: string;
  booking?: Booking;
  span: number;
}

export function CalendarGrid({ rooms, bookings, days }: { rooms: Room[]; bookings: Booking[]; days: string[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Booking["status"]>("all");
  const [dragBookingId, setDragBookingId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (query.trim() && !b.guest.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [bookings, query, status]);

  function bookingFor(roomNumber: string, date: string): Booking | undefined {
    return filtered.find((b) => b.status !== "cancelled" && b.roomNumber === roomNumber && date >= b.checkIn && date < b.checkOut);
  }

  // Collapse consecutive days occupied by the same booking into one spanning
  // segment (a table cell with colSpan) instead of one badge per day — a
  // 4-night stay renders as one bar 4 columns wide, not 4 separate ones.
  function segmentsFor(roomNumber: string): Segment[] {
    const segments: Segment[] = [];
    let i = 0;
    while (i < days.length) {
      const date = days[i];
      const booking = bookingFor(roomNumber, date);
      if (!booking) {
        segments.push({ date, span: 1 });
        i += 1;
        continue;
      }
      let span = 0;
      while (i + span < days.length && bookingFor(roomNumber, days[i + span])?.id === booking.id) {
        span += 1;
      }
      segments.push({ date, booking, span });
      i += span;
    }
    return segments;
  }

  function handleDrop(targetRoom: Room, targetDate: string) {
    setDragOverKey(null);
    if (!dragBookingId) return;
    const booking = bookings.find((b) => b.id === dragBookingId);
    setDragBookingId(null);
    if (!booking) return;
    if (!targetRoom.active) {
      setError(`Room ${targetRoom.roomNumber} is inactive — can't move a booking there.`);
      return;
    }
    const nights = daysBetween(booking.checkIn, booking.checkOut);
    const newCheckOut = addDays(targetDate, nights);
    if (booking.roomNumber === targetRoom.roomNumber && booking.checkIn === targetDate) return;

    setError(null);
    startTransition(async () => {
      const result = await rescheduleBookingAction(booking.id, {
        roomNumber: targetRoom.roomNumber,
        checkIn: targetDate,
        checkOut: newCheckOut,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input placeholder="Search guest name..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="max-w-[160px]">
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="checked-in">Checked-in</option>
          <option value="checked-out">Checked-out</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-show</option>
        </Select>
        <span className="text-xs text-neutral-400">Click a stay for full details. Drag confirmed/checked-in/waitlisted stays to move them.</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-4 py-3 text-left font-medium text-neutral-500 border-b border-r border-neutral-200 z-10">
                Room
              </th>
              {days.map((date) => {
                const d = new Date(date);
                return (
                  <th key={date} className="px-2 py-3 text-center font-medium text-neutral-500 border-b border-neutral-200 min-w-[84px]">
                    <div className="font-mono">{d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                    <div className="text-xs text-neutral-400">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="sticky left-0 bg-white px-4 py-2 border-r border-b border-neutral-100 font-medium font-mono whitespace-nowrap z-10">
                  {room.roomNumber}
                  {!room.active && <span className="ml-2 text-xs text-neutral-400 font-sans">(inactive)</span>}
                </td>
                {segmentsFor(room.roomNumber).map((seg) => {
                  const cellKey = `${room.roomNumber}|${seg.date}`;
                  const isDragOver = dragOverKey === cellKey;
                  const draggable = seg.booking && DRAGGABLE_STATUSES.includes(seg.booking.status);
                  return (
                    <td
                      key={seg.date}
                      colSpan={seg.span}
                      className={`p-1 border-b border-neutral-100 ${isDragOver ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : ""}`}
                      onDragOver={(e) => {
                        if (!dragBookingId) return;
                        e.preventDefault();
                        setDragOverKey(cellKey);
                      }}
                      onDragLeave={() => setDragOverKey((k) => (k === cellKey ? null : k))}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(room, seg.date);
                      }}
                    >
                      {seg.booking ? (
                        <button
                          type="button"
                          onClick={() => setDetailBooking(seg.booking!)}
                          title={`${seg.booking.guest.name} · ${seg.booking.checkIn} → ${seg.booking.checkOut}${draggable ? " · drag to move" : ""}`}
                          draggable={draggable}
                          onDragStart={(e) => {
                            if (!draggable) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.effectAllowed = "move";
                            setDragBookingId(seg.booking!.id);
                          }}
                          onDragEnd={() => setDragBookingId(null)}
                          className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium truncate hover:opacity-90 ${STATUS_BAR_STYLES[seg.booking.status]} ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                        >
                          <span className="truncate">{seg.booking.guest.name}</span>
                          {seg.span > 1 && <span className="font-mono opacity-80 shrink-0">{seg.span}n</span>}
                        </button>
                      ) : (
                        <div className="h-7" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailBooking && <BookingDetailPanel booking={detailBooking} onClose={() => setDetailBooking(null)} />}
    </div>
  );
}
