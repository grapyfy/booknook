"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { NAV_ITEMS, NAV_GROUPS } from "@/constants/nav";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";
import { LogoutButton } from "@/components/LogoutButton";
import { TopbarSearch } from "@/components/TopbarSearch";
import { NotificationBell } from "@/components/NotificationBell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // /dashboard-preview exists so the UI is viewable without real Supabase
  // credentials (/dashboard itself is gated by middleware.ts and crashes
  // without them — see STATUS.md). While browsing via the preview route, the
  // sidebar's "Dashboard" link should stay on it too, not bounce back into
  // the gated route.
  const isPreview = pathname.startsWith("/dashboard-preview");

  // Pick the single longest-matching nav href, so e.g. /bookings/calendar
  // highlights only "Calendar", not both "Calendar" and "Bookings" (which is
  // a prefix of it).
  const activeHref = [...NAV_ITEMS]
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`) || (isPreview && item.href === "/dashboard")
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const navContent = (
    <>
      <div className="px-5 py-5 flex items-center justify-between gap-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            B
          </span>
          <span className="text-lg font-semibold">GRAP</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden h-8 w-8 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
          aria-label="Close menu"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <div className="px-3 pb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wide">{group.label}</div>
            {group.items.map((item) => {
              const active = item.href === activeHref;
              const href = item.href === "/dashboard" && isPreview ? "/dashboard-preview" : item.href;
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-neutral-200 bg-white flex-col">{navContent}</aside>

      {/* Mobile sidebar — slide-over drawer, only rendered/interactive when open */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full bg-white flex flex-col shadow-xl">{navContent}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-neutral-200 bg-white flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
          </button>
          <OnlineStatusBadge />
          <TopbarSearch />
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
