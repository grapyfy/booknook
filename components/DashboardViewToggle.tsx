"use client";

// The dashboard renders at two paths — the real /dashboard (gated by
// middleware.ts's Supabase auth check) and /dashboard-preview (a plain
// re-export, kept specifically so the UI is viewable with no real Supabase
// credentials — see STATUS.md). Building this toggle's hrefs from the
// *current* pathname instead of hardcoding "/dashboard" means clicking
// Minimal/Detailed while on the preview route stays on the preview route,
// instead of bouncing into the gated one and crashing.
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGaugeHigh, faChartLine } from "@fortawesome/free-solid-svg-icons";

export function DashboardViewToggle({ detailed }: { detailed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
      <Link
        href={pathname}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          !detailed ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <FontAwesomeIcon icon={faGaugeHigh} className="h-3 w-3" />
        Minimal
      </Link>
      <Link
        href={`${pathname}?view=detailed`}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          detailed ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <FontAwesomeIcon icon={faChartLine} className="h-3 w-3" />
        Detailed
      </Link>
    </div>
  );
}
