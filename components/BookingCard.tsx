import type { Booking } from "@/types/booking";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 flex items-center justify-between">
      <div>
        <div className="font-medium">{booking.guest.name}</div>
        <div className="text-sm text-neutral-500">
          Room {booking.roomNumber} · {booking.checkIn} → {booking.checkOut}
        </div>
      </div>
      <StatusBadge status={booking.status} />
    </div>
  );
}
