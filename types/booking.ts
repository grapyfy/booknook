// The shared "contract" — the exact shape of a Booking and a Guest.
// Both the backend (real data) and the UI (mock data, before the backend is ready)
// build against this file. If it needs to change, both people agree first — see CLAUDE.md.

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Booking {
  id: string;
  guest: Guest;
  checkIn: string; // "2026-09-01"
  checkOut: string; // "2026-09-03"
  roomNumber: string;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  amount: number; // total in rupees, always computed server-side — never trust a client-sent amount
  createdAt: string; // ISO timestamp
}

// Example data for the UI to build against before the real API exists.
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    guest: { id: "g1", name: "Rajesh Kumar", phone: "+919876543210" },
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    roomNumber: "101",
    status: "confirmed",
    amount: 3500,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
];
