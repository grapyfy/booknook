"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { createGroupBookingAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/types/room";

interface RoomRow {
  roomNumber: string;
  checkIn: string;
  checkOut: string;
}

export function GroupBookingForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const defaultRoom = rooms.find((r) => r.active)?.roomNumber ?? "";
  const [groupName, setGroupName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [rows, setRows] = useState<RoomRow[]>([
    { roomNumber: defaultRoom, checkIn: "", checkOut: "" },
    { roomNumber: defaultRoom, checkIn: "", checkOut: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // One availability check per row (each has its own dates) — same "fail open,
  // hint only" pattern as NewBookingForm/WalkInBookingForm. Keyed by row index,
  // so re-runs whenever that row's own dates change, independent of the others.
  const [availabilityByRow, setAvailabilityByRow] = useState<(Set<string> | null)[]>(rows.map(() => null));

  useEffect(() => {
    setAvailabilityByRow((prev) => rows.map((_, i) => prev[i] ?? null));
    const controllers = rows.map((row, i) => {
      if (!row.checkIn || !row.checkOut || row.checkOut <= row.checkIn) {
        setAvailabilityByRow((prev) => prev.map((v, j) => (j === i ? null : v)));
        return null;
      }
      const controller = new AbortController();
      fetch(`/api/rooms/available?checkIn=${row.checkIn}&checkOut=${row.checkOut}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: Room[]) => {
          setAvailabilityByRow((prev) => prev.map((v, j) => (j === i ? new Set(data.map((r) => r.roomNumber)) : v)));
        })
        .catch(() => {
          setAvailabilityByRow((prev) => prev.map((v, j) => (j === i ? null : v)));
        });
      return controller;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
    return () => controllers.forEach((c) => c?.abort());
  }, [JSON.stringify(rows.map((r) => `${r.checkIn}|${r.checkOut}`))]);

  function updateRow(index: number, patch: Partial<RoomRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { roomNumber: defaultRoom, checkIn: "", checkOut: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const totalEstimate = rows.reduce((sum, row) => {
    const room = rooms.find((r) => r.roomNumber === row.roomNumber);
    if (!room || !row.checkIn || !row.checkOut) return sum;
    const nights = Math.max(1, Math.round((new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime()) / 86400000));
    return sum + room.ratePerNight * nights;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createGroupBookingAction({
      groupName,
      contact: { name: contactName, phone: contactPhone },
      rooms: rows,
    });
    setSubmitting(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.push("/bookings/groups");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
      <FormField label="Group name" htmlFor="groupName">
        <Input id="groupName" required placeholder="e.g. Sharma Wedding Party" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact name" htmlFor="contactName">
          <Input id="contactName" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </FormField>
        <FormField label="Contact phone" htmlFor="contactPhone">
          <Input id="contactPhone" required placeholder="+919876543210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">Rooms</label>
        {rows.map((row, i) => {
          const availableForRow = availabilityByRow[i] ?? null;
          const rowRoomUnavailable =
            availableForRow !== null && row.roomNumber !== "" && !availableForRow.has(row.roomNumber);
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Select value={row.roomNumber} onChange={(e) => updateRow(i, { roomNumber: e.target.value })} className="flex-1">
                  {rooms.map((room) => {
                    const known = availableForRow !== null;
                    const isAvailable = !known || availableForRow!.has(room.roomNumber);
                    return (
                      <option key={room.id} value={room.roomNumber} disabled={!room.active}>
                        {room.roomNumber} — {room.roomType} · ₹{room.ratePerNight}/night
                        {!room.active ? " (inactive)" : known && !isAvailable ? " (booked for these dates)" : ""}
                      </option>
                    );
                  })}
                </Select>
                <Input type="date" required value={row.checkIn} onChange={(e) => updateRow(i, { checkIn: e.target.value })} className="w-40" />
                <Input type="date" required value={row.checkOut} onChange={(e) => updateRow(i, { checkOut: e.target.value })} className="w-40" />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 2}
                  title="Remove room"
                  className="text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-neutral-400"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                </button>
              </div>
              {rowRoomUnavailable && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
                  Room {row.roomNumber} is already booked for an overlapping date range.
                </p>
              )}
            </div>
          );
        })}
        <button type="button" onClick={addRow} className="self-start inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          Add another room
        </button>
      </div>

      {totalEstimate > 0 && (
        <p className="text-sm text-neutral-500">
          Estimated total: ₹{totalEstimate.toLocaleString("en-IN")} across {rows.length} rooms (final amount is computed on save)
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create group booking"}
        </Button>
      </div>
    </form>
  );
}
