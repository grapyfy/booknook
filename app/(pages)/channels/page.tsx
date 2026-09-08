"use client";

// UI-ONLY STUB. CLAUDE.md's v1 scope explicitly defers OTA channel-manager
// engineering until API access is confirmed — "don't build this
// speculatively." This screen exists as a UI mockup only, at the user's
// explicit request (2026-09-08), matching the reference product's own
// framing of its equivalent screen as "illustrative." Nothing here talks to
// any real OTA. "Sync now" does nothing.
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { IllustrativeBanner } from "@/components/IllustrativeBanner";

const PARTNERS = [
  { name: "MakeMyTrip", type: "OTA", desc: "ARI push, reservations, modifications & cancellations" },
  { name: "Goibibo", type: "OTA", desc: "Inventory, BAR & promo rates, booking delivery" },
  { name: "Booking.com", type: "OTA", desc: "Connectivity partner flow — rates, restrictions, availability" },
  { name: "Agoda", type: "OTA", desc: "Room mapping, min stay, CTA/CTD parity" },
  { name: "Airbnb", type: "OTA", desc: "iCal / API-style sync for eligible inventory" },
  { name: "Google Hotels", type: "Metasearch", desc: "Rate feed & landing alignment with direct booking" },
];

export default function ChannelsPage() {
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 900); // purely cosmetic — no real sync exists
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Channels & integrations</h1>
          <p className="text-sm text-neutral-500">Which OTA partners BookNook is built to support.</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <FontAwesomeIcon icon={faArrowsRotate} className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing (demo)..." : "Sync now (demo)"}
        </Button>
      </div>

      <IllustrativeBanner>
        This screen is illustrative — per CLAUDE.md&apos;s v1 scope, OTA channel-manager engineering is deferred until
        a specific partner integration is confirmed with a paying hotel. No real MakeMyTrip/Goibibo/Booking.com
        connection exists yet.
      </IllustrativeBanner>

      <div className="grid grid-cols-3 gap-4">
        {PARTNERS.map((p) => (
          <div key={p.name} className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{p.type}</span>
            </div>
            <p className="text-sm text-neutral-500">{p.desc}</p>
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              Not connected — illustrative only
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
