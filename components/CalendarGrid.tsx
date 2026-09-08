"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { rescheduleBookingAction } from "@/components/lib/actions";
import type { Booking } from "@/types/booking";
import type { Room } from "@/types/room";

const STATUS_CELL_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-100",
  "checked-in": "bg-green-50 text-green-700 border-green-100",
  "checked-out": "bg-neutral-50 text-neutral-400 border-neutral-100",
  cancelled: "bg-red-50 text-red-700 border-red-100",
  waitlisted: "bg-amber-50 text-amber-700 border-amber-100",
  "no-show": "bg-orange-50 text-orange-700 border-orange-100",
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

export function CalendarGrid({ rooms, bookings, days }: { rooms: Room[]; bookings: Booking[]; days: string[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Booking["status"]>("all");
  const [dragBookingId, setDragBookingId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex gap-3 items-center">
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
        <span className="text-xs text-neutral-400">Drag a confirmed/checked-in/waitlisted booking to a new room or date to move it.</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="text-sm border-collapse">
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
                {days.map((date) => {
                  const booking = bookingFor(room.roomNumber, date);
                  const cellKey = `${room.roomNumber}|${date}`;
                  const isDragOver = dragOverKey === cellKey;
                  const draggable = booking && DRAGGABLE_STATUSES.includes(booking.status);
                  return (
                    <td
                      key={date}
                      className={`p-1 border-b border-neutral-100 ${isDragOver ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : ""}`}
                      onDragOver={(e) => {
                        if (!dragBookingId) return;
                        e.preventDefault();
                        setDragOverKey(cellKey);
                      }}
                      onDragLeave={() => setDragOverKey((k) => (k === cellKey ? null : k))}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(room, date);
                      }}
                    >
                      {booking ? (
                        <Link
                          href={`/bookings/${booking.id}/folio`}
                          title={`${booking.guest.name} · ${booking.checkIn} → ${booking.checkOut}${draggable ? " · drag to move" : ""}`}
                          draggable={draggable}
                          onDragStart={(e) => {
                            if (!draggable) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.effectAllowed = "move";
                            setDragBookingId(booking.id);
                          }}
                          onDragEnd={() => setDragBookingId(null)}
                          className={`block rounded px-1.5 py-1 text-xs border truncate hover:opacity-80 ${STATUS_CELL_STYLES[booking.status]} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          {booking.guest.name}
                        </Link>
                      ) : (
                        <div className="h-6" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
