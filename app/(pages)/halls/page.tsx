// UI-ONLY STUB — banquet/event hall booking isn't in CLAUDE.md's v1 scope,
// built at the user's explicit request (2026-09-08). Read-only illustration,
// no create/edit flow (unlike bookings/rooms, which are real v1 features).
import { HallsGrid } from "@/components/HallsGrid";
import { listVenuesMock, listHallEventsMock } from "@/components/lib/hallsMock";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

export default async function HallsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? "2026-09-08";
  const venues = listVenuesMock();
  const events = listHallEventsMock(date);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Halls & events</h1>
        <p className="text-sm text-neutral-500">Hourly venue calendar for banquet halls and meeting rooms.</p>
      </div>
      <IllustrativeBanner>
        Read-only illustration — banquet/event booking isn&apos;t in GRAP&apos;s v1 scope yet. Sample data only, no
        create/edit flow.
      </IllustrativeBanner>
      <HallsGrid venues={venues} events={events} date={date} />
    </div>
  );
}
