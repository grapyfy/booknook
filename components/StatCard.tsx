import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export function StatCard({
  icon,
  label,
  value,
  deltaPct,
  deltaLabel = "vs last week",
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  deltaPct?: number;
  deltaLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-3">
      <span className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <div>
        <div className="text-2xl font-semibold font-mono">{value}</div>
        <div className="text-sm text-neutral-500">{label}</div>
      </div>
      {deltaPct !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${deltaPct >= 0 ? "text-green-700" : "text-red-700"}`}>
          <FontAwesomeIcon icon={deltaPct >= 0 ? faArrowUp : faArrowDown} className="h-2.5 w-2.5" />
          <span className="font-mono">{Math.abs(deltaPct)}%</span>
          <span className="text-neutral-400 font-normal">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
