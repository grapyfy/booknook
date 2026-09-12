import { db } from "@/lib/db";
import type { MaintenanceStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN"],
  IN_PROGRESS: ["WAITING", "RESOLVED"],
  WAITING: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [], // terminal
};

export async function listTickets(status?: MaintenanceStatus) {
  return db.maintenanceTicket.findMany({
    where: status ? { status } : undefined,
    include: { room: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTicket(input: {
  roomId?: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  description: string;
}) {
  return db.maintenanceTicket.create({ data: input });
}

// Assigning a technician auto-advances an OPEN ticket to ASSIGNED — matches the UI
// branch's mock behavior exactly. Re-assigning an already-in-progress ticket to a
// different technician just changes `assignedToId`, no status change.
export async function assignTechnician(id: string, staffId: string) {
  const ticket = await db.maintenanceTicket.findUniqueOrThrow({ where: { id } });
  return db.maintenanceTicket.update({
    where: { id },
    data: { assignedToId: staffId, status: ticket.status === "OPEN" ? "ASSIGNED" : ticket.status },
  });
}

// `repairCost` is required (not defaulted to 0) when resolving — an unknown cost
// should block the transition, not silently record a wrong number.
export async function updateTicketStatus(id: string, next: MaintenanceStatus, repairCost?: number) {
  const ticket = await db.maintenanceTicket.findUniqueOrThrow({ where: { id } });
  if (!ALLOWED_TRANSITIONS[ticket.status].includes(next)) {
    throw new Error(`Cannot move a ${ticket.status} ticket to ${next}`);
  }
  if (next === "RESOLVED" && (repairCost === undefined || repairCost < 0)) {
    throw new Error("A repair cost is required to resolve a ticket");
  }
  return db.maintenanceTicket.update({
    where: { id },
    data: { status: next, repairCost: next === "RESOLVED" ? repairCost : ticket.repairCost },
  });
}
