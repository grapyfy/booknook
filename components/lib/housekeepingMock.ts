// Housekeeping — a new mock domain, deliberately NOT a field on Room (types/room.ts).
// A room's cleanliness is a sequence of daily tasks (dirty -> cleaning ->
// inspected -> ready), not a single static property, so it's modeled the same
// way bookings/maintenance are: its own entity, loosely referencing a room
// number as a string rather than a hard contract relation. File-persisted
// alongside the rest of the mock store — same module-instance gotcha as
// mockData.ts (see its top comment) would otherwise apply here too.
import fs from "fs";
import path from "path";
import { listRoomsMock } from "@/components/lib/mockData";

export type HousekeepingStatus = "dirty" | "cleaning" | "inspected" | "ready";
export type HousekeepingPriority = "low" | "normal" | "high";

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  date: string; // YYYY-MM-DD — which day's cleaning cycle this is
  status: HousekeepingStatus;
  priority: HousekeepingPriority;
  assignedStaff?: string;
  notes?: string;
  updatedAt: string;
}

interface HkStore {
  tasks: HousekeepingTask[];
  nextId: number;
}

const HK_STORE_PATH = path.join(process.cwd(), ".mock-store-housekeeping.json");

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function seedTasksForToday(): HousekeepingTask[] {
  const today = todayISO();
  const rooms = listRoomsMock().filter((r) => r.active);
  // Varied starting statuses on purpose so the board has something in every
  // column to demo, not all "ready" — mirrors a real mid-morning snapshot.
  const seedStatus: HousekeepingStatus[] = ["dirty", "cleaning", "inspected", "ready"];
  return rooms.map((room, i) => ({
    id: `hk${i + 1}`,
    roomNumber: room.roomNumber,
    date: today,
    status: seedStatus[i % seedStatus.length],
    priority: i === 0 ? "high" : "normal",
    assignedStaff: i % 2 === 0 ? "Sunita Rawat" : undefined,
    notes: i === 0 ? "Guest checked out late, prioritize for next arrival." : undefined,
    updatedAt: new Date().toISOString(),
  }));
}

function loadHkStore(): HkStore {
  try {
    const raw = fs.readFileSync(HK_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as HkStore;
    // Re-seed if the stored tasks are from a previous "today" (stale demo data).
    if (parsed.tasks.length > 0 && parsed.tasks[0].date !== todayISO()) {
      const tasks = seedTasksForToday();
      return { tasks, nextId: tasks.length };
    }
    return parsed;
  } catch {
    const tasks = seedTasksForToday();
    return { tasks, nextId: tasks.length };
  }
}

function saveHkStore(store: HkStore): void {
  fs.writeFileSync(HK_STORE_PATH, JSON.stringify(store, null, 2));
}

export function listHousekeepingTasksMock(): HousekeepingTask[] {
  return [...loadHkStore().tasks].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

// Linear cleaning cycle: dirty -> cleaning -> inspected -> ready. Ready can go
// back to dirty (next guest checks out / room gets used again) — the only
// non-linear step, and a realistic one.
const HK_TRANSITIONS: Record<HousekeepingStatus, HousekeepingStatus[]> = {
  dirty: ["cleaning"],
  cleaning: ["inspected"],
  inspected: ["ready", "dirty"], // inspection can fail and send it back
  ready: ["dirty"],
};

export function advanceHousekeepingStatusMock(id: string, next: HousekeepingStatus): HousekeepingTask {
  const store = loadHkStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error("Housekeeping task not found");
  if (!HK_TRANSITIONS[task.status].includes(next)) {
    throw new Error(`Cannot move a ${task.status} room to ${next}`);
  }
  task.status = next;
  task.updatedAt = new Date().toISOString();
  saveHkStore(store);
  return task;
}

export function assignHousekeepingStaffMock(id: string, staffName: string): HousekeepingTask {
  const store = loadHkStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error("Housekeeping task not found");
  task.assignedStaff = staffName || undefined;
  task.updatedAt = new Date().toISOString();
  saveHkStore(store);
  return task;
}
