import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { advanceTaskStatus, assignTask, updateTaskDetails } from "@/services/housekeepingService";

// One PATCH endpoint, `action` picks the operation — keeps the transition-enforcement
// (advance) separate from plain field edits (assign/details), matching how the UI
// branch's mock actions are split.
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("advance") }),
  z.object({ action: z.literal("assign"), staffId: z.string().uuid().nullable() }),
  z.object({
    action: z.literal("update-details"),
    priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
    notes: z.string().max(1000).optional(),
  }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "advance") return NextResponse.json(await advanceTaskStatus(id));
    if (parsed.data.action === "assign") return NextResponse.json(await assignTask(id, parsed.data.staffId));
    return NextResponse.json(await updateTaskDetails(id, parsed.data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
