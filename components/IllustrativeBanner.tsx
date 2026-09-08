import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

// Reused wherever a screen is a UI-only stub (no real backend behind it yet) —
// e.g. Channels/OTA sync, Halls & events, Users & roles, Settings saves. Keeps
// that honest, same spirit as the reference product's own "demo — nothing is
// saved to a server" framing, so nobody mistakes a stub for a working feature.
export function IllustrativeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 text-blue-900 px-4 py-3 text-sm flex items-start gap-2.5">
      <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
      <span>{children}</span>
    </div>
  );
}
