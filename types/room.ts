// The shared "contract" for rooms — same convention as types/booking.ts.

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
  active: boolean;
}

// Extended with a few more rows (2026-09-08) — same shape, no contract change —
// including a room above the ₹7,500 GST threshold and an inactive one, so the
// booking form's "room not bookable" and 18% GST-slab paths are actually previewable.
export const MOCK_ROOMS: Room[] = [
  { id: "r1", roomNumber: "101", roomType: "Standard", ratePerNight: 2500, active: true },
  { id: "r2", roomNumber: "204", roomType: "Deluxe", ratePerNight: 4500, active: true },
  { id: "r3", roomNumber: "102", roomType: "Standard", ratePerNight: 2500, active: true },
  { id: "r4", roomNumber: "301", roomType: "Suite", ratePerNight: 9000, active: true },
  { id: "r5", roomNumber: "302", roomType: "Suite", ratePerNight: 9500, active: false },
];
