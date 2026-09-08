// Shared OTA/metasearch partner list — extracted (2026-09-08) so /channels'
// partner cards and the stop-sell inventory matrix both read from one list
// instead of drifting apart.
export interface ChannelPartner {
  name: string;
  type: "OTA" | "Metasearch";
  desc: string;
}

export const CHANNEL_PARTNERS: ChannelPartner[] = [
  { name: "MakeMyTrip", type: "OTA", desc: "ARI push, reservations, modifications & cancellations" },
  { name: "Goibibo", type: "OTA", desc: "Inventory, BAR & promo rates, booking delivery" },
  { name: "Booking.com", type: "OTA", desc: "Connectivity partner flow — rates, restrictions, availability" },
  { name: "Agoda", type: "OTA", desc: "Room mapping, min stay, CTA/CTD parity" },
  { name: "Airbnb", type: "OTA", desc: "iCal / API-style sync for eligible inventory" },
  { name: "Google Hotels", type: "Metasearch", desc: "Rate feed & landing alignment with direct booking" },
];

// Metasearch doesn't take direct reservations the way an OTA does, so
// stop-sell/inventory control only makes sense for the OTA rows.
export const OTA_PARTNER_NAMES: string[] = CHANNEL_PARTNERS.filter((p) => p.type === "OTA").map((p) => p.name);
