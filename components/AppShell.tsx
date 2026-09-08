"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NAV_ITEMS, NAV_GROUPS } from "@/constants/nav";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";
import { LogoutButton } from "@/components/LogoutButton";
import { TopbarSearch } from "@/components/TopbarSearch";
import { NotificationBell } from "@/components/NotificationBell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-neutral-200">
          <span className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            B
          </span>
          <span className="text-lg font-semibold">BookNook</span>
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
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-neutral-200 bg-white flex items-center justify-between gap-4 px-6 shrink-0">
          <OnlineStatusBadge />
          <TopbarSearch />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
