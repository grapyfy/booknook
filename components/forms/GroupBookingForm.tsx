"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
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
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select value={row.roomNumber} onChange={(e) => updateRow(i, { roomNumber: e.target.value })} className="flex-1">
              {rooms.map((room) => (
                <option key={room.id} value={room.roomNumber} disabled={!room.active}>
                  {room.roomNumber} — {room.roomType} · ₹{room.ratePerNight}/night
                </option>
              ))}
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
        ))}
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
