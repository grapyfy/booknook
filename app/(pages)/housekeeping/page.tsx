import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faSprayCanSparkles, faMagnifyingGlass, faCheck } from "@fortawesome/free-solid-svg-icons";
import { listTasksForDate } from "@/services/housekeepingService";
import { listStaff } from "@/services/staffService";
import { HousekeepingBoard } from "@/components/HousekeepingBoard";
import type { HousekeepingStatus, HousekeepingPriority } from "@/components/lib/housekeepingMock";

const STATUS_TO_CONTRACT: Record<string, HousekeepingStatus> = {
  DIRTY: "dirty",
  CLEANING: "cleaning",
  INSPECTED: "inspected",
  READY: "ready",
};
const PRIORITY_TO_CONTRACT: Record<string, HousekeepingPriority> = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
};

export default async function HousekeepingPage() {
  const [rows, allStaff] = await Promise.all([listTasksForDate(new Date()), listStaff()]);

  // Adapted to the shape HousekeepingBoard.tsx expects (lowercase status/priority,
  // real assignedToId instead of a free-text name) — real backend uses UPPERCASE
  // Prisma enums and a Staff relation, per the schema.
  const tasks = rows.map((r) => ({
    id: r.id,
    roomNumber: r.room.roomNumber,
    date: r.date.toISOString().slice(0, 10),
    status: STATUS_TO_CONTRACT[r.status],
    priority: PRIORITY_TO_CONTRACT[r.priority],
    assignedStaff: r.assignedTo?.name,
    assignedToId: r.assignedToId ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const staffOptions = allStaff
    .filter((s) => s.active && (s.role === "HOUSEKEEPING_SUPERVISOR" || s.role === "HOUSEKEEPING_STAFF"))
    .map((s) => ({ id: s.id, name: s.name }));

  const counts = {
    dirty: tasks.filter((t) => t.status === "dirty").length,
    cleaning: tasks.filter((t) => t.status === "cleaning").length,
    inspected: tasks.filter((t) => t.status === "inspected").length,
    ready: tasks.filter((t) => t.status === "ready").length,
  };

  const stats = [
    { label: "Dirty", value: counts.dirty, icon: faBroom, color: "text-red-600 bg-red-50" },
    { label: "Cleaning", value: counts.cleaning, icon: faSprayCanSparkles, color: "text-blue-600 bg-blue-50" },
    { label: "Inspected", value: counts.inspected, icon: faMagnifyingGlass, color: "text-amber-600 bg-amber-50" },
    { label: "Ready", value: counts.ready, icon: faCheck, color: "text-green-600 bg-green-50" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Housekeeping</h1>
        <p className="text-sm text-neutral-500">Today&apos;s room-cleaning status, room by room.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${s.color}`}>
              <FontAwesomeIcon icon={s.icon} className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-semibold font-mono">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {staffOptions.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          No active housekeeping staff accounts exist yet — tasks can still be advanced, but assignment has nobody to
          pick from until a HOUSEKEEPING_SUPERVISOR/HOUSEKEEPING_STAFF login is provisioned (see CLAUDE.md,{" "}
          <span className="font-mono">scripts/create-staff.js</span>).
        </div>
      )}

      <HousekeepingBoard tasks={tasks} staff={staffOptions} />

      <p className="text-xs text-neutral-400">
        Drag isn&apos;t needed here — cleaning is a strict sequence (dirty → cleaning → inspected → ready), so each card
        just advances to the next step. One task per active room, auto-created for today on first load.
      </p>
    </div>
  );
}
