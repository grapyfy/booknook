import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assignTechnician, updateTicketStatus } from "@/services/maintenanceService";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), staffId: z.string().uuid() }),
  z.object({
    action: z.literal("set-status"),
    status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]),
    // Required by the service when status is "RESOLVED" — validated there, not here,
    // so the one rule ("resolving needs a real repair cost") lives in exactly one place.
    repairCost: z.number().min(0).max(10_000_000).optional(),
  }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "assign") return NextResponse.json(await assignTechnician(id, parsed.data.staffId));
    return NextResponse.json(await updateTicketStatus(id, parsed.data.status, parsed.data.repairCost));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update ticket";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
