import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { listMaintenanceTicketsMock } from "@/components/lib/maintenanceMock";
import { Button } from "@/components/ui/Button";
import { MaintenanceTicketCard } from "@/components/MaintenanceTicketCard";
import type { MaintenanceStatus } from "@/components/lib/maintenanceMock";

const STATUS_OPTIONS: { value: "all" | MaintenanceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = STATUS_OPTIONS.some((o) => o.value === statusParam) ? (statusParam as (typeof STATUS_OPTIONS)[number]["value"]) : "all";

  const allTickets = listMaintenanceTicketsMock();
  const tickets = status === "all" ? allTickets : allTickets.filter((t) => t.status === status);
  const openCount = allTickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Maintenance</h1>
          <p className="text-sm text-neutral-500">{openCount} open ticket{openCount === 1 ? "" : "s"} across the property.</p>
        </div>
        <Link href="/maintenance/new">
          <Button>
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            New ticket
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((o) => (
          <Link
            key={o.value}
            href={o.value === "all" ? "/maintenance" : `/maintenance?status=${o.value}`}
            className={`text-sm rounded-full px-3 py-1.5 font-medium transition-colors ${
              status === o.value ? "bg-blue-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {tickets.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white px-4 py-12 text-center text-neutral-500">
            <div className="flex flex-col items-center gap-2">
              <FontAwesomeIcon icon={faScrewdriverWrench} className="h-6 w-6 text-neutral-300" />
              <div>No tickets match this filter.</div>
            </div>
          </div>
        )}
        {tickets.map((ticket) => (
          <MaintenanceTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
