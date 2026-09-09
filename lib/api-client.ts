/**
 * Client-side API helper for secure, type-safe server calls.
 * Never sends sensitive data client-side; all auth/validation happens server-side.
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `API error: ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.error || json.message || errorMsg;
    } catch {
      // Fallback if response isn't JSON
    }
    throw { message: errorMsg, status: response.status } as ApiError;
  }

  return response;
}

// Bookings
export async function listBookings() {
  const res = await apiFetch("/api/bookings");
  return res.json();
}

export async function getBooking(id: string) {
  const res = await apiFetch(`/api/bookings/${id}`);
  return res.json();
}

export async function createBooking(input: {
  guest: { name: string; phone: string; email?: string; idType?: string; idNumber?: string };
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  source?: string;
  notes?: string;
  rateOverride?: number;
  discountAmount?: number;
  paymentStatus?: string;
  priceNote?: string;
  extraServices?: { name: string; amount: number }[];
}) {
  const res = await apiFetch("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateBookingStatus(id: string, status: string) {
  const res = await apiFetch(`/api/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function rescheduleBooking(id: string, input: {
  roomNumber?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const res = await apiFetch(`/api/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return res.json();
}

// Rooms
export async function listRooms() {
  const res = await apiFetch("/api/rooms");
  return res.json();
}

export async function createRoom(input: { roomNumber: string; roomType: string; ratePerNight: number }) {
  const res = await apiFetch("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

// Guests
export async function getGuestBookingsByPhone(phone: string) {
  const res = await apiFetch(`/api/guests?phone=${encodeURIComponent(phone)}`);
  return res.json();
}

// Folio
export async function generateFolio(bookingId: string) {
  const res = await apiFetch(`/api/bookings/${bookingId}/folio`);
  return res.json();
}

// Alerts
export async function getBookingAlerts() {
  const res = await apiFetch("/api/bookings/alerts");
  return res.json();
}
