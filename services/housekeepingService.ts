import { db } from "@/lib/db";
import type { HousekeepingStatus } from "@prisma/client";

// Forward progression is linear (Dirty -> Cleaning -> Inspected -> Ready), but two
// backward moves are real, intentional UI actions, not skips: an inspector can fail
// a room (Inspected -> Dirty, re-clean) and a Ready room can be marked dirty again
// (e.g. a guest re-occupied it) — matches exactly what HousekeepingBoard.tsx's UI
// offers, not a superset. No other transition is allowed (e.g. Dirty -> Ready
// directly, or Cleaning -> Dirty, aren't real actions the UI exposes).
const ALLOWED_TRANSITIONS: Record<HousekeepingStatus, HousekeepingStatus[]> = {
  DIRTY: ["CLEANING"],
  CLEANING: ["INSPECTED"],
  INSPECTED: ["READY", "DIRTY"],
  READY: ["DIRTY"],
};

function startOfDay(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

// Ensures every active room has a task row for the given day, creating missing ones
// as DIRTY. This is the real-database version of the mock layer's "auto-reseed" —
// get-or-create per room per day, rather than deleting/regenerating rows, so a task
// someone already started on isn't silently reset.
export async function listTasksForDate(date: Date) {
  const day = startOfDay(date);
  const activeRooms = await db.room.findMany({ where: { active: true } });

  const existing = await db.housekeepingTask.findMany({
    where: { date: day },
    include: { room: true, assignedTo: true },
  });
  const existingRoomIds = new Set(existing.map((t) => t.roomId));

  const missing = activeRooms.filter((r) => !existingRoomIds.has(r.id));
  if (missing.length > 0) {
    await db.housekeepingTask.createMany({
      data: missing.map((r) => ({ roomId: r.id, date: day })),
      skipDuplicates: true, // the @@unique([roomId, date]) constraint is the real guard against a race here
    });
  }

  return db.housekeepingTask.findMany({
    where: { date: day },
    include: { room: true, assignedTo: true },
    orderBy: { room: { roomNumber: "asc" } },
  });
}

export async function advanceTaskStatus(id: string, next: HousekeepingStatus) {
  const task = await db.housekeepingTask.findUniqueOrThrow({ where: { id } });
  const allowed = ALLOWED_TRANSITIONS[task.status];
  if (!allowed.includes(next)) {
    throw new Error(`Cannot move a ${task.status.toLowerCase()} task to ${next.toLowerCase()}`);
  }
  return db.housekeepingTask.update({ where: { id }, data: { status: next } });
}

export async function assignTask(id: string, staffId: string | null) {
  return db.housekeepingTask.update({ where: { id }, data: { assignedToId: staffId } });
}

export async function updateTaskDetails(id: string, input: { priority?: "LOW" | "NORMAL" | "HIGH"; notes?: string }) {
  return db.housekeepingTask.update({ where: { id }, data: input });
}
