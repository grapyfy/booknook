// Pure date math shared across server pages, client components, and the mock data
// layer. Client components must import from here directly rather than from
// components/lib/mockData.ts, which pulls in fs/path for its file-backed mock
// store and would break the client bundle (same hazard constants/maintenance.ts
// was split out to avoid).
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

// "14:00" -> "2:00 PM" — for display only, never used in any date-math comparison
// (those all stay on the raw 24h HH:mm string, see Booking.checkInTime's schema comment).
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
