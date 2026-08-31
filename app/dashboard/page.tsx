// Starting point for UI work. Uses MOCK_BOOKINGS from the contract for now —
// swap for a real fetch("/api/bookings") once the backend is ready, same shape either way.
import { MOCK_BOOKINGS } from "@/types/booking";
import { BookingCard } from "@/components/BookingCard";

export default function DashboardPage() {
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Today's bookings</h1>
      <div className="flex flex-col gap-3">
        {MOCK_BOOKINGS.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </main>
  );
}
