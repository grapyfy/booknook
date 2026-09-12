import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listTickets, createTicket } from "@/services/maintenanceService";
import { requireStaff } from "@/lib/require-staff";

const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"] as const;

export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const statusParam = req.nextUrl.searchParams.get("status");
  const status = statusParam && (STATUSES as readonly string[]).includes(statusParam) ? (statusParam as (typeof STATUSES)[number]) : undefined;
  return NextResponse.json(await listTickets(status));
}

const schema = z.object({
  roomId: z.string().uuid().optional(),
  category: z.string().min(1).max(60),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  description: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ticket = await createTicket(parsed.data);
  return NextResponse.json(ticket, { status: 201 });
}
