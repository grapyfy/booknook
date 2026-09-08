// Part-to-whole composition -> a single horizontal stacked bar, not a donut
// (the dataviz skill flags pie/donut as the wrong default here). Status colors
// (green/blue/amber), each with an icon + label + count — never color alone.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const SEGMENTS = [
  { key: "available", label: "Available", swatch: "bg-green-600", text: "text-green-700" },
  { key: "occupied", label: "Occupied", swatch: "bg-blue-600", text: "text-blue-700" },
  { key: "maintenance", label: "Maintenance", swatch: "bg-amber-500", text: "text-amber-700" },
] as const;

export function RoomStatusBar({
  available,
  occupied,
  maintenance,
}: {
  available: number;
  occupied: number;
  maintenance: number;
}) {
  const total = available + occupied + maintenance;
  const counts = { available, occupied, maintenance };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-6 w-full overflow-hidden rounded-md bg-neutral-100 gap-0.5">
        {SEGMENTS.map((seg) => {
          const count = counts[seg.key];
          if (count === 0 || total === 0) return null;
          return (
            <div
              key={seg.key}
              className={`${seg.swatch} h-full`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${seg.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-6 text-sm">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircle} className={`h-2 w-2 ${seg.text}`} />
            <span className="text-neutral-500">{seg.label}</span>
            <span className="font-mono font-medium">{counts[seg.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
