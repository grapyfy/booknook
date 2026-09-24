import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { listAuditLogs } from "@/services/auditLogService";

const DOMAIN_STYLES: Record<string, string> = {
  booking: "bg-blue-100 text-blue-700",
  room: "bg-green-100 text-green-700",
  rate_rule: "bg-amber-100 text-amber-700",
  settings: "bg-purple-100 text-purple-700",
};

function actionLabel(action: string): string {
  return action
    .split(".")
    .slice(1)
    .join(" ")
    .split("_")
    .join(" ");
}

// Real AuditLog.details is Prisma JSON — could be null, a primitive, an array,
// or (the actual shape logAction always writes) a flat object. Guard for the
// non-object cases explicitly rather than assuming the mock's always-object shape.
function formatDetails(details: unknown): string {
  if (details === null || details === undefined) return "—";
  if (typeof details !== "object" || Array.isArray(details)) return String(details);
  return Object.entries(details as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>;
}) {
  const { entityType } = await searchParams;
  // Fetch once, unfiltered, up to a real cap — real `listAuditLogs` doesn't have a
  // separate "distinct entity types" query, so the filter pills are derived from
  // whatever's actually in the last 200 entries rather than a second round-trip.
  const allEntries = await listAuditLogs({ limit: 200 });
  const entityTypes = [...new Set(allEntries.map((e) => e.entityType))].sort();
  const entries = entityType ? allEntries.filter((e) => e.entityType === entityType) : allEntries;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Activity log</h1>
        <p className="text-sm text-neutral-500">Who did what, across every real write action in GRAP.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/activity-log"
          className={`text-sm rounded-full px-3 py-1.5 font-medium transition-colors ${
            !entityType ? "bg-blue-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          All
        </Link>
        {entityTypes.map((t) => (
          <Link
            key={t}
            href={`/activity-log?entityType=${t}`}
            className={`text-sm rounded-full px-3 py-1.5 font-medium transition-colors ${
              entityType === t ? "bg-blue-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="h-6 w-6 text-neutral-300" />
                    <div>No activity matches this filter.</div>
                  </div>
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const domain = entry.action.split(".")[0];
              return (
                <tr key={entry.id} className="border-b border-neutral-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-neutral-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">{entry.staffName ?? <span className="text-neutral-400">System</span>}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        DOMAIN_STYLES[domain] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {actionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 whitespace-nowrap">
                    {entry.entityType} · {entry.entityId}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDetails(entry.details)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
