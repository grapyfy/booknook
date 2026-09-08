import { db } from "@/lib/db";

export async function listHalls() {
  return db.hall.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export async function createHall(input: { name: string; capacity: number; ratePerEvent: number }) {
  return db.hall.create({ data: input });
}

export async function listHallEvents(hallId?: string) {
  return db.hallEvent.findMany({
    where: { hallId, status: { not: "CANCELLED" } },
    include: { hall: true },
    orderBy: { startsAt: "asc" },
  });
}

// Same overlap principle as bookingService's overbooking check: a hall can't host two
// events whose time ranges intersect. `amount` is always the hall's real rate at
// booking time, never accepted from the client — same rule as room bookings.
export async function createHallEvent(input: {
  hallId: string;
  eventName: string;
  contactName: string;
  contactPhone: string;
  startsAt: string; // ISO datetime
  endsAt: string;
}) {
  const hall = await db.hall.findUnique({ where: { id: input.hallId } });
  if (!hall) throw new Error("Hall does not exist");
  if (!hall.active) throw new Error("Hall is not active");

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (endsAt <= startsAt) throw new Error("Event end time must be after the start time");

  const overlapping = await db.hallEvent.findFirst({
    where: {
      hallId: input.hallId,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlapping) throw new Error(`Hall is already booked for an overlapping time (event: ${overlapping.eventName})`);

  return db.hallEvent.create({
    data: {
      hallId: input.hallId,
      eventName: input.eventName,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      startsAt,
      endsAt,
      amount: hall.ratePerEvent,
    },
  });
}
