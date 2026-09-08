"use client";

// Stub for CLAUDE.md's v1 "offline check-in with a sync queue" requirement —
// this only reflects real browser online/offline state; the actual local queue
// + background sync is a separate, larger effort (see STATUS.md).
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi } from "@fortawesome/free-solid-svg-icons";

export function OnlineStatusBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
        online ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
      title={online ? "Online — changes save immediately" : "Offline — changes will sync when back online"}
    >
      <FontAwesomeIcon icon={faWifi} className="h-3 w-3" />
      {online ? "Online" : "Offline"}
    </span>
  );
}
