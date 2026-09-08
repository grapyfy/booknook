import { db } from "@/lib/db";
import type { HousekeepingStatus } from "@prisma/client";

// Linear, no skipping — matches the UI branch's mock enforcement exactly
// (Dirty -> Cleaning -> Inspected -> Ready).
const NEXT_STATUS: Record<HousekeepingStatus, HousekeepingStatus | null> = {
  DIRTY: "CLEANING",
  CLEANING: "INSPECTED",
  INSPECTED: "READY",
  READY: null, // terminal for the day
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

export async function advanceTaskStatus(id: string) {
  const task = await db.housekeepingTask.findUniqueOrThrow({ where: { id } });
  const next = NEXT_STATUS[task.status];
  if (!next) throw new Error(`Task is already ${task.status} — nothing further today`);
  return db.housekeepingTask.update({ where: { id }, data: { status: next } });
}

export async function assignTask(id: string, staffId: string | null) {
  return db.housekeepingTask.update({ where: { id }, data: { assignedToId: staffId } });
}

export async function updateTaskDetails(id: string, input: { priority?: "LOW" | "NORMAL" | "HIGH"; notes?: string }) {
  return db.housekeepingTask.update({ where: { id }, data: input });
}
