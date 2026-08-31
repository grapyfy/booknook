import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getStaffBySupabaseUserId } from "@/services/staffService";
import { listBookings } from "@/services/bookingService";
import { BookingCard } from "@/components/BookingCard";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // belt-and-suspenders — middleware already handles this

  const staff = await getStaffBySupabaseUserId(user.id);
  if (!staff || !staff.active) {
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <p>Ye account staff list mein nahi hai. Owner se contact karo.</p>
        <LogoutButton />
      </main>
    );
  }

  const bookings = await listBookings();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Today&apos;s bookings</h1>
          <p className="text-sm text-neutral-500">{staff.name} · {staff.role}</p>
        </div>
        <LogoutButton />
      </div>
      <div className="flex flex-col gap-3">
        {bookings.length === 0 && <p className="text-neutral-500">Koi booking nahi hai abhi.</p>}
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </main>
  );
}
