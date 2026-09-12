// Pure GST slab-rate math, shared between the server (billingService.ts, the real
// folio) and client booking forms (live tax-inclusive price preview) — no server-only
// imports here on purpose, so client components can import it directly. Keeping this
// in one place means a future slab-rate change (new tier, different threshold) can't
// desync the live estimate shown while booking from the actual invoice.
export interface GstConfig {
  thresholdRupees: number;
  lowRatePercent: number;
  highRatePercent: number;
}

export function gstRateForRoomRate(roomRatePerNight: number, config: GstConfig): number {
  return roomRatePerNight > config.thresholdRupees ? config.highRatePercent : config.lowRatePercent;
}
