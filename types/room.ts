// The shared "contract" for rooms — same convention as types/booking.ts.

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
  active: boolean;
}

export const MOCK_ROOMS: Room[] = [
  { id: "r1", roomNumber: "101", roomType: "Standard", ratePerNight: 2500, active: true },
  { id: "r2", roomNumber: "204", roomType: "Deluxe", ratePerNight: 4500, active: true },
];
