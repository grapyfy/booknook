// Pure date math shared across server pages, client components, and the mock data
// layer. Client components must import from here directly rather than from
// components/lib/mockData.ts, which pulls in fs/path for its file-backed mock
// store and would break the client bundle (same hazard constants/maintenance.ts
// was split out to avoid).
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}
