"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";

export function SyncNowButton() {
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 900); // purely cosmetic — no real sync exists
  }

  return (
    <Button onClick={handleSync} disabled={syncing}>
      <FontAwesomeIcon icon={faArrowsRotate} className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing (demo)..." : "Sync now (demo)"}
    </Button>
  );
}
