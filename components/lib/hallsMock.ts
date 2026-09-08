// Mock data for the Halls & events stub screen — a new concept (banquet/event
// venues) not in CLAUDE.md's v1 scope, built at the user's explicit request
// (2026-09-08) as a UI-only illustration. Static, read-only for now — no
// create/edit flow, unlike bookings/rooms which are real v1 features.
export interface Venue {
  id: string;
  name: string;
  capacity: number;
  floor: string;
}

export interface HallEvent {
  id: string;
  venueId: string;
  host: string;
  purpose: string;
  date: string; // "2026-09-08"
  startHour: number; // 24h, e.g. 10
  endHour: number;
  status: "confirmed" | "in-progress" | "hold" | "cancelled";
}

export const MOCK_VENUES: Venue[] = [
  { id: "v1", name: "Grand Ballroom", capacity: 420, floor: "Lower ground" },
  { id: "v2", name: "Summit Auditorium", capacity: 180, floor: "2nd floor" },
  { id: "v3", name: "Boardroom A", capacity: 22, floor: "2nd floor" },
];

export const MOCK_HALL_EVENTS: HallEvent[] = [
  { id: "h1", venueId: "v1", host: "Priya Sharma", purpose: "Wedding reception", date: "2026-09-08", startHour: 10, endHour: 14, status: "confirmed" },
  { id: "h2", venueId: "v2", host: "Rahul Verma", purpose: "Northwind Travels — annual meet", date: "2026-09-08", startHour: 9, endHour: 11, status: "in-progress" },
  { id: "h3", venueId: "v3", host: "Meera Krishnan", purpose: "Board sign-off (Q1)", date: "2026-09-08", startHour: 14, endHour: 15, status: "confirmed" },
  { id: "h4", venueId: "v3", host: "Vikram Singh Chauhan", purpose: "Leadership interviews", date: "2026-09-08", startHour: 16, endHour: 18, status: "confirmed" },
  { id: "h5", venueId: "v1", host: "Fatima Sheikh", purpose: "Product launch", date: "2026-09-09", startHour: 11, endHour: 15, status: "hold" },
];

export function listVenuesMock(): Venue[] {
  return MOCK_VENUES;
}

export function listHallEventsMock(date: string): HallEvent[] {
  return MOCK_HALL_EVENTS.filter((e) => e.date === date);
}
