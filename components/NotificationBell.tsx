"use client";

// Honest empty state — no real notification system exists yet, so this never
// shows fabricated notification content, unlike the reference's decorative
// red-dot bell. Clicking it just shows "No notifications yet."
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
        title="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg p-4 text-sm text-neutral-400 z-20">
          No notifications yet.
        </div>
      )}
    </div>
  );
}
