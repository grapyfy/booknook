// The shared "contract" — the exact shape of a Booking and a Guest.
// Both the backend (real data) and the UI (mock data, before the backend is ready)
// build against this file. If it needs to change, both people agree first — see CLAUDE.md.

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  // Digital KYC (2026-09-08 addition, both optional — backward-compatible,
  // agreed with the team before adding per CLAUDE.md's contract rule).
  idType?: "aadhaar" | "passport" | "driving_license" | "voter_id" | "other";
  idNumber?: string;
}

export interface Booking {
  id: string;
  guest: Guest;
  checkIn: string; // "2026-09-01"
  checkOut: string; // "2026-09-03"
  roomNumber: string;
  // "waitlisted" and "no-show" added 2026-09-08 (front-desk depth pass) —
  // additive, every existing status value and consumer still valid.
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled" | "waitlisted" | "no-show";
  amount: number; // total in rupees, always computed server-side — never trust a client-sent amount
  createdAt: string; // ISO timestamp
  // All optional/additive (2026-09-08) — nothing existing breaks.
  source?: "direct" | "walk-in" | "phone" | "other"; // how the booking was taken; absent = legacy row, treat as "direct"
  notes?: string; // internal notes / guest special requests
  groupId?: string; // set when this booking is one room in a multi-room group booking
  groupName?: string; // e.g. "Sharma Wedding Party" — same on every booking sharing a groupId
  // Calendar-detail additions (2026-09-08) — also additive/optional.
  paymentStatus?: "prepaid" | "postpaid" | "partial"; // absent = unknown/legacy row, shown as "postpaid" (front-desk default)
  extraServices?: ExtraService[]; // add-on charges (room service, laundry, etc) — NOT yet included in `amount` or the GST folio; display-only until the billing-depth phase wires them into the invoice
  // Pricing-control additions (2026-09-08) — also additive/optional.
  discountAmount?: number; // flat rupee discount applied when this booking was created, already netted into `amount` — kept separately just so the folio can show it as a line item
  priceNote?: string; // free-text reason for a manual rate override/discount (e.g. "Corporate rate", "GM approved 10% off") — audit trail, not used in any calculation
  // Check-in/checkout TIME (2026-09-12, contract-approved by Abhay+Gautam) — "14:00"/
  // "11:00" (24h HH:mm), deliberately separate from checkIn/checkOut (which stay
  // date-only) so no existing date comparison (calendar, availability, GST nights
  // math) is affected. Defaults to the hotel's PropertySettings.defaultCheckInTime/
  // defaultCheckOutTime when not explicitly set on a booking. This is the PLANNED
  // time — the ACTUAL check-in/check-out moment is separately recorded in the audit
  // log (every status change already logs a real timestamp).
  checkInTime?: string;
  checkOutTime?: string;
}

// A single add-on charge against a booking (room service, laundry, minibar...).
// Deliberately separate from `amount` (room charges only, GST-relevant) — see
// the note on `extraServices` above.
export interface ExtraService {
  name: string;
  amount: number;
}

export interface Folio {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  sacCode: string;
  baseAmount: number;
  gstRate: number;
  gstType: "CGST_SGST" | "IGST";
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  createdAt: string;
  // Billing-depth additions (2026-09-08) — additive/optional.
  voided?: boolean; // an invoice that was cancelled/superseded — excluded from GSTR-1 export, kept in history for audit
  voidReason?: string;
}

// Example data for the UI to build against before the real API exists.
// Extended with a few more rows (2026-09-08) so dashboard screens have enough
// variety (different statuses/rooms) to actually preview against — same shape,
// no contract change.
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    guest: { id: "g1", name: "Rajesh Kumar", phone: "+919876543210", idType: "aadhaar", idNumber: "XXXX-XXXX-4210" },
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    roomNumber: "101",
    status: "confirmed",
    amount: 3500,
    createdAt: "2026-08-31T10:00:00.000Z",
    paymentStatus: "postpaid",
  },
  {
    id: "b2",
    guest: {
      id: "g2",
      name: "Priya Sharma",
      phone: "+919812345678",
      email: "priya.sharma@example.com",
      idType: "passport",
      idNumber: "P1234567",
    },
    checkIn: "2026-09-05",
    checkOut: "2026-09-08",
    roomNumber: "204",
    status: "checked-in",
    amount: 13500,
    createdAt: "2026-09-04T09:15:00.000Z",
    paymentStatus: "prepaid",
    extraServices: [
      { name: "Room service — dinner", amount: 850 },
      { name: "Laundry", amount: 300 },
    ],
  },
  {
    id: "b3",
    guest: { id: "g3", name: "Arvind Rao", phone: "+919845098450" },
    checkIn: "2026-09-02",
    checkOut: "2026-09-04",
    roomNumber: "101",
    status: "checked-out",
    amount: 5000,
    createdAt: "2026-09-01T14:30:00.000Z",
    paymentStatus: "postpaid",
    extraServices: [{ name: "Minibar", amount: 450 }],
  },
  {
    id: "b4",
    guest: { id: "g4", name: "Fatima Sheikh", phone: "+919900112233", email: "fatima.sheikh@example.com" },
    checkIn: "2026-09-10",
    checkOut: "2026-09-12",
    roomNumber: "301",
    status: "confirmed",
    amount: 18000,
    createdAt: "2026-09-07T11:00:00.000Z",
    paymentStatus: "partial",
  },
  {
    id: "b5",
    guest: { id: "g5", name: "Karan Mehta", phone: "+919988776655" },
    checkIn: "2026-08-28",
    checkOut: "2026-08-30",
    roomNumber: "102",
    status: "cancelled",
    amount: 5000,
    createdAt: "2026-08-27T08:00:00.000Z",
  },
  {
    id: "b6",
    guest: { id: "g6", name: "Sunita Iyer", phone: "+919876123450" },
    checkIn: "2026-09-08",
    checkOut: "2026-09-09",
    roomNumber: "204",
    status: "confirmed",
    amount: 4500,
    createdAt: "2026-09-08T07:45:00.000Z",
    source: "direct",
    notes: "Late arrival expected, around 11 PM.",
  },
  // Deliberately left unresolved (never auto-checked-in, checkIn already in the
  // past as of "today" 2026-09-08) so the bookings list's "possible no-show"
  // detection has a real row to surface — not a fabricated alert count.
  {
    id: "b7",
    guest: { id: "g7", name: "Deepak Nair", phone: "+919845011223" },
    checkIn: "2026-09-03",
    checkOut: "2026-09-05",
    roomNumber: "302",
    status: "confirmed",
    amount: 19000,
    createdAt: "2026-09-01T12:00:00.000Z",
    source: "phone",
  },
  // A real waitlist row — requested a specific room, not yet confirmed.
  {
    id: "b8",
    guest: { id: "g8", name: "Meera Pillai", phone: "+919900223344" },
    checkIn: "2026-09-15",
    checkOut: "2026-09-17",
    roomNumber: "101",
    status: "waitlisted",
    amount: 5000,
    createdAt: "2026-09-08T06:00:00.000Z",
    source: "direct",
  },
  // A 2-room group booking that deliberately overlaps b4's dates on room 301 —
  // demonstrates real overbooking detection (computed from these two rows'
  // actual overlapping ranges, not a fabricated warning).
  {
    id: "b9",
    guest: { id: "g9", name: "Rohan Malhotra", phone: "+919811002233" },
    checkIn: "2026-09-11",
    checkOut: "2026-09-13",
    roomNumber: "301",
    status: "confirmed",
    amount: 18000,
    createdAt: "2026-09-08T09:00:00.000Z",
    source: "direct",
    groupId: "grp1",
    groupName: "Malhotra Family Trip",
  },
  {
    id: "b10",
    guest: { id: "g10", name: "Rohan Malhotra", phone: "+919811002233" },
    checkIn: "2026-09-11",
    checkOut: "2026-09-13",
    roomNumber: "204",
    status: "confirmed",
    amount: 9000,
    createdAt: "2026-09-08T09:00:00.000Z",
    source: "direct",
    groupId: "grp1",
    groupName: "Malhotra Family Trip",
  },
];
