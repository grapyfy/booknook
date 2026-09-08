import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBroom, faSprayCanSparkles, faMagnifyingGlass, faCheck } from "@fortawesome/free-solid-svg-icons";
import { listHousekeepingTasksMock } from "@/components/lib/housekeepingMock";
import { HousekeepingBoard } from "@/components/HousekeepingBoard";

export default function HousekeepingPage() {
  const tasks = listHousekeepingTasksMock();
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

      <HousekeepingBoard tasks={tasks} />

      <p className="text-xs text-neutral-400">
        Drag isn&apos;t needed here — cleaning is a strict sequence (dirty → cleaning → inspected → ready), so each card
        just advances to the next step. Sample data resets to a fresh mix each new day.
      </p>
    </div>
  );
}
