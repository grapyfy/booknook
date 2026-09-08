"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMaintenanceTicketAction } from "@/components/lib/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/types/room";
import type { MaintenanceCategory, MaintenancePriority } from "@/components/lib/maintenanceMock";

const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  ac: "AC",
  furniture: "Furniture",
  bathroom: "Bathroom",
  internet: "Internet",
  appliance: "Appliance",
  other: "Other",
};

export function MaintenanceTicketForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState(rooms[0]?.roomNumber ?? "");
  const [category, setCategory] = useState<MaintenanceCategory>("other");
  const [priority, setPriority] = useState<MaintenancePriority>("normal");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createMaintenanceTicketAction({ roomNumber, category, description, priority });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/maintenance");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <FormField label="Room" htmlFor="room">
        <Select id="room" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}>
          {rooms.map((room) => (
            <option key={room.id} value={room.roomNumber}>
              {room.roomNumber} — {room.roomType}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" htmlFor="category">
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Priority" htmlFor="priority">
          <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as MaintenancePriority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Description" htmlFor="description">
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What's wrong, and any detail a technician would need"
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 resize-none"
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create ticket"}
        </Button>
      </div>
    </form>
  );
}
