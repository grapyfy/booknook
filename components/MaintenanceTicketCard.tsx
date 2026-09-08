"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faDroplet,
  faSnowflake,
  faCouch,
  faBath,
  faWifi,
  faPlug,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  assignMaintenanceTechnicianAction,
  updateMaintenanceTicketStatusAction,
} from "@/components/lib/actions";
import { MOCK_STAFF } from "@/constants/staff";
import type { MaintenanceTicket, MaintenanceStatus } from "@/components/lib/maintenanceMock";

const CATEGORY_ICONS: Record<MaintenanceTicket["category"], typeof faBolt> = {
  electrical: faBolt,
  plumbing: faDroplet,
  ac: faSnowflake,
  furniture: faCouch,
  bathroom: faBath,
  internet: faWifi,
  appliance: faPlug,
  other: faScrewdriverWrench,
};

const CATEGORY_LABELS: Record<MaintenanceTicket["category"], string> = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  ac: "AC",
  furniture: "Furniture",
  bathroom: "Bathroom",
  internet: "Internet",
  appliance: "Appliance",
  other: "Other",
};

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  open: "bg-red-100 text-red-700",
  assigned: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  waiting: "bg-neutral-100 text-neutral-600",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-neutral-200 text-neutral-500",
};

const PRIORITY_STYLES: Record<MaintenanceTicket["priority"], string> = {
  low: "bg-neutral-100 text-neutral-500",
  normal: "bg-blue-50 text-blue-600",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export function MaintenanceTicketCard({ ticket }: { ticket: MaintenanceTicket }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [costInput, setCostInput] = useState("");
  const [resolving, setResolving] = useState(false);

  function assignTechnician(name: string) {
    setError(null);
    startTransition(async () => {
      const result = await assignMaintenanceTechnicianAction(ticket.id, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function updateStatus(next: MaintenanceStatus, cost?: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateMaintenanceTicketStatusAction(ticket.id, next, cost);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setResolving(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={CATEGORY_ICONS[ticket.category]} className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div>
            <div className="font-medium">
              Room {ticket.roomNumber} · <span className="text-neutral-500 font-normal">{CATEGORY_LABELS[ticket.category]}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-0.5">{ticket.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status]}`}>{ticket.status}</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">Technician:</span>
          <Select
            value={ticket.assignedTechnician ?? ""}
            onChange={(e) => assignTechnician(e.target.value)}
            disabled={pending || ticket.status === "closed"}
            className="text-sm py-1"
          >
            <option value="">Unassigned</option>
            {MOCK_STAFF.map((s) => (
              <option key={s.email} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
          {typeof ticket.cost === "number" && (
            <span className="text-neutral-400 font-mono text-xs">₹{ticket.cost.toLocaleString("en-IN")} spent</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {ticket.status === "assigned" && (
            <button
              onClick={() => updateStatus("in-progress")}
              disabled={pending}
              className="text-xs font-medium rounded-md px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Start work
            </button>
          )}
          {ticket.status === "in-progress" && !resolving && (
            <>
              <button
                onClick={() => updateStatus("waiting")}
                disabled={pending}
                className="text-xs font-medium rounded-md px-3 py-1.5 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Mark waiting
              </button>
              <button
                onClick={() => setResolving(true)}
                disabled={pending}
                className="text-xs font-medium rounded-md px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Resolve
              </button>
            </>
          )}
          {ticket.status === "in-progress" && resolving && (
            <>
              <Input
                type="number"
                min={0}
                placeholder="Cost ₹"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                className="w-24 text-xs py-1.5"
              />
              <button
                onClick={() => updateStatus("resolved", Number(costInput) || 0)}
                disabled={pending}
                className="text-xs font-medium rounded-md px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </>
          )}
          {ticket.status === "waiting" && (
            <button
              onClick={() => updateStatus("in-progress")}
              disabled={pending}
              className="text-xs font-medium rounded-md px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Resume
            </button>
          )}
          {ticket.status === "resolved" && (
            <button
              onClick={() => updateStatus("closed")}
              disabled={pending}
              className="text-xs font-medium rounded-md px-3 py-1.5 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              Close ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
