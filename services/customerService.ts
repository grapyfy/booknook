import { db } from "@/lib/db";

export interface CustomerSummary {
  phone: string;
  name: string; // most recent booking's guest name for this phone
  email?: string;
  totalBookings: number;
  totalSpend: number; // sum of `amount` across all their bookings, cancelled ones excluded
  lastBookingAt: string; // ISO — most recent booking's createdAt
}

// Aggregates the guest directory from Booking/Guest — there's no separate Customer
// table (would duplicate Guest with no real distinction at this stage; see the
// guest-dedup note in guestService.ts). Grouped by phone in application code rather
// than a Prisma `groupBy` because we also need each group's most-recent name/email,
// which `groupBy` can't express in one query without a window function.
export async function listCustomers(search?: string): Promise<CustomerSummary[]> {
  const bookings = await db.booking.findMany({
    where: search
      ? { guest: { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } }
      : undefined,
    include: { guest: true },
    orderBy: { createdAt: "desc" },
  });

  const byPhone = new Map<string, CustomerSummary>();
  for (const b of bookings) {
    const existing = byPhone.get(b.guest.phone);
    if (!existing) {
      byPhone.set(b.guest.phone, {
        phone: b.guest.phone,
        name: b.guest.name,
        email: b.guest.email ?? undefined,
        totalBookings: 1,
        totalSpend: b.status === "CANCELLED" ? 0 : b.amount,
        lastBookingAt: b.createdAt.toISOString(),
      });
    } else {
      existing.totalBookings += 1;
      if (b.status !== "CANCELLED") existing.totalSpend += b.amount;
      // bookings are already newest-first, so the first one seen per phone is the
      // most recent — name/email/lastBookingAt are never overwritten after that
    }
  }
  return Array.from(byPhone.values());
}
