// Maintenance tickets — a new mock domain, same pattern as housekeepingMock.ts:
// its own entity, loosely referencing a room number as a string rather than a
// hard Room contract relation (a room can accumulate many tickets over time;
// this doesn't belong as a field on Room itself).
import fs from "fs";
import path from "path";

export type MaintenanceCategory = "electrical" | "plumbing" | "ac" | "furniture" | "bathroom" | "internet" | "appliance" | "other";
export type MaintenancePriority = "low" | "normal" | "high" | "urgent";
export type MaintenanceStatus = "open" | "assigned" | "in-progress" | "waiting" | "resolved" | "closed";

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTechnician?: string;
  cost?: number; // actual repair cost, filled in once resolved
  createdAt: string;
  updatedAt: string;
}

interface MaintStore {
  tickets: MaintenanceTicket[];
  nextId: number;
}

const MAINT_STORE_PATH = path.join(process.cwd(), ".mock-store-maintenance.json");

const SEED_TICKETS: MaintenanceTicket[] = [
  {
    id: "mt1",
    roomNumber: "302",
    category: "ac",
    description: "AC unit not cooling, compressor making a loud noise.",
    priority: "high",
    status: "in-progress",
    assignedTechnician: "Manoj Tiwari",
    createdAt: "2026-09-06T09:00:00.000Z",
    updatedAt: "2026-09-07T11:00:00.000Z",
  },
  {
    id: "mt2",
    roomNumber: "101",
    category: "plumbing",
    description: "Bathroom tap leaking continuously.",
    priority: "normal",
    status: "open",
    createdAt: "2026-09-08T07:30:00.000Z",
    updatedAt: "2026-09-08T07:30:00.000Z",
  },
  {
    id: "mt3",
    roomNumber: "204",
    category: "internet",
    description: "Wi-Fi not connecting, guest reported low signal.",
    priority: "low",
    status: "resolved",
    assignedTechnician: "Manoj Tiwari",
    cost: 0,
    createdAt: "2026-09-04T14:00:00.000Z",
    updatedAt: "2026-09-04T16:30:00.000Z",
  },
];

function loadMaintStore(): MaintStore {
  try {
    const raw = fs.readFileSync(MAINT_STORE_PATH, "utf-8");
    return JSON.parse(raw) as MaintStore;
  } catch {
    return { tickets: [...SEED_TICKETS], nextId: 100 };
  }
}

function saveMaintStore(store: MaintStore): void {
  fs.writeFileSync(MAINT_STORE_PATH, JSON.stringify(store, null, 2));
}

export function listMaintenanceTicketsMock(): MaintenanceTicket[] {
  return [...loadMaintStore().tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createMaintenanceTicketMock(input: {
  roomNumber: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
}): MaintenanceTicket {
  const store = loadMaintStore();
  store.nextId += 1;
  const ticket: MaintenanceTicket = {
    id: `mt${store.nextId}`,
    roomNumber: input.roomNumber,
    category: input.category,
    description: input.description,
    priority: input.priority,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.tickets.push(ticket);
  saveMaintStore(store);
  return ticket;
}

// open -> assigned -> in-progress -> waiting | resolved; waiting -> in-progress;
// resolved -> closed. closed is terminal. Mirrors a real maintenance workflow:
// you can't "close" a ticket without it having been resolved first.
const MAINT_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  open: ["assigned"],
  assigned: ["in-progress"],
  "in-progress": ["waiting", "resolved"],
  waiting: ["in-progress"],
  resolved: ["closed"],
  closed: [],
};

export function updateMaintenanceTicketStatusMock(id: string, next: MaintenanceStatus, cost?: number): MaintenanceTicket {
  const store = loadMaintStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) throw new Error("Maintenance ticket not found");
  if (!MAINT_TRANSITIONS[ticket.status].includes(next)) {
    throw new Error(`Cannot move a ${ticket.status} ticket to ${next}`);
  }
  ticket.status = next;
  if (next === "resolved" && typeof cost === "number" && cost >= 0) ticket.cost = cost;
  ticket.updatedAt = new Date().toISOString();
  saveMaintStore(store);
  return ticket;
}

export function assignMaintenanceTechnicianMock(id: string, technician: string): MaintenanceTicket {
  const store = loadMaintStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) throw new Error("Maintenance ticket not found");
  ticket.assignedTechnician = technician || undefined;
  if (ticket.status === "open" && technician) ticket.status = "assigned";
  ticket.updatedAt = new Date().toISOString();
  saveMaintStore(store);
  return ticket;
}
