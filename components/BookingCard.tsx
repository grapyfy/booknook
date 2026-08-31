import type { Booking } from "@/types/booking";

const STATUS_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-100 text-red-700",
};

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 flex items-center justify-between">
      <div>
        <div className="font-medium">{booking.guest.name}</div>
        <div className="text-sm text-neutral-500">
          Room {booking.roomNumber} · {booking.checkIn} → {booking.checkOut}
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[booking.status]}`}>
        {booking.status}
      </span>
    </div>
  );
}
