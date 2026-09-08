import type { Booking } from "@/types/booking";

const STATUS_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-100 text-red-700",
  waitlisted: "bg-amber-100 text-amber-700",
  "no-show": "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
