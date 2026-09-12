"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowRotateLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { Select } from "@/components/ui/Select";
import { advanceHousekeepingStatusAction, assignHousekeepingStaffAction } from "@/components/lib/actions";
import { MOCK_STAFF } from "@/constants/staff";
import type { HousekeepingTask, HousekeepingStatus } from "@/components/lib/housekeepingMock";

const HOUSEKEEPING_STAFF = MOCK_STAFF.filter((s) => s.role === "HOUSEKEEPING");

const COLUMNS: { status: HousekeepingStatus; label: string; headerStyle: string }[] = [
  { status: "dirty", label: "Dirty", headerStyle: "bg-red-50 text-red-700" },
  { status: "cleaning", label: "Cleaning", headerStyle: "bg-blue-50 text-blue-700" },
  { status: "inspected", label: "Inspected", headerStyle: "bg-amber-50 text-amber-700" },
  { status: "ready", label: "Ready", headerStyle: "bg-green-50 text-green-700" },
];

const PRIORITY_STYLES: Record<HousekeepingTask["priority"], string> = {
  low: "bg-neutral-100 text-neutral-500",
  normal: "bg-blue-50 text-blue-600",
  high: "bg-red-100 text-red-700",
};

const NEXT_LABEL: Record<HousekeepingStatus, string> = {
  dirty: "Start cleaning",
  cleaning: "Send for inspection",
  inspected: "Mark ready",
  ready: "",
};
const NEXT_STATUS: Record<HousekeepingStatus, HousekeepingStatus | null> = {
  dirty: "cleaning",
  cleaning: "inspected",
  inspected: "ready",
  ready: null,
};

function TaskCard({ task }: { task: HousekeepingTask }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function advance(next: HousekeepingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await advanceHousekeepingStatusAction(task.id, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function assignStaff(name: string) {
    startTransition(async () => {
      await assignHousekeepingStaffAction(task.id, name);
      router.refresh();
    });
  }

  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono font-medium">Room {task.roomNumber}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      </div>
      {task.notes && <p className="text-xs text-neutral-500">{task.notes}</p>}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
        <Select
          value={task.assignedStaff ?? ""}
          onChange={(e) => assignStaff(e.target.value)}
          className="text-xs py-1 px-1.5 flex-1"
          disabled={pending}
        >
          <option value="">Unassigned</option>
          {HOUSEKEEPING_STAFF.map((s) => (
            <option key={s.email} value={s.name}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        {nextStatus && (
          <button
            onClick={() => advance(nextStatus)}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {NEXT_LABEL[task.status]}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </button>
        )}
        {task.status === "inspected" && (
          <button
            onClick={() => advance("dirty")}
            disabled={pending}
            title="Inspection failed — send back for re-cleaning"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faArrowRotateLeft} className="h-3 w-3" />
          </button>
        )}
        {task.status === "ready" && (
          <button
            onClick={() => advance("dirty")}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2 py-1.5 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Mark dirty again
          </button>
        )}
      </div>
    </div>
  );
}

export function HousekeepingBoard({ tasks }: { tasks: HousekeepingTask[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-between ${col.headerStyle}`}>
              <span>{col.label}</span>
              <span className="font-mono">{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {colTasks.length === 0 && <div className="text-xs text-neutral-300 text-center py-4">Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
