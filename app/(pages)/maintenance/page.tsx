import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { listTickets } from "@/services/maintenanceService";
import { listStaff } from "@/services/staffService";
import { Button } from "@/components/ui/Button";
import { MaintenanceTicketCard } from "@/components/MaintenanceTicketCard";
import type { MaintenanceStatus, MaintenanceCategory, MaintenancePriority } from "@/components/lib/maintenanceMock";

const STATUS_OPTIONS: { value: "all" | MaintenanceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_TO_CONTRACT: Record<string, MaintenanceStatus> = {
  OPEN: "open",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in-progress",
  WAITING: "waiting",
  RESOLVED: "resolved",
  CLOSED: "closed",
};
const PRIORITY_TO_CONTRACT: Record<string, MaintenancePriority> = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = STATUS_OPTIONS.some((o) => o.value === statusParam) ? (statusParam as (typeof STATUS_OPTIONS)[number]["value"]) : "all";

  const [rows, allStaff] = await Promise.all([listTickets(), listStaff()]);

  // Adapted to MaintenanceTicketCard's expected shape — real backend uses
  // UPPERCASE Prisma enums, a nullable Room relation (a ticket can be for a
  // common area), and a free-text category column (no enum in the DB, per the
  // schema comment — trusted to match one of MaintenanceCategory's values
  // since createTicket only ever writes values from that same constant list).
  const allTickets = rows.map((r) => ({
    id: r.id,
    roomNumber: r.room?.roomNumber ?? "Common area",
    category: r.category as MaintenanceCategory,
    description: r.description,
    priority: PRIORITY_TO_CONTRACT[r.priority],
    status: STATUS_TO_CONTRACT[r.status],
    assignedTechnician: r.assignedTo?.name,
    assignedToId: r.assignedToId ?? undefined,
    cost: r.repairCost ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const tickets = status === "all" ? allTickets : allTickets.filter((t) => t.status === status);
  const openCount = allTickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;

  const staffOptions = allStaff.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {staffOptions.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          No active staff accounts exist yet to assign tickets to (see <span className="font-mono">scripts/create-staff.js</span>).
        </div>
      )}

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
          <MaintenanceTicketCard key={ticket.id} ticket={ticket} staff={staffOptions} />
        ))}
      </div>
    </div>
  );
}
