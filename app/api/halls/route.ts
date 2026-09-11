import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listHalls, createHall } from "@/services/hallService";
import { requireStaff } from "@/lib/require-staff";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  return NextResponse.json(await listHalls());
}

const schema = z.object({
  name: z.string().min(1).max(80),
  capacity: z.number().int().positive().max(100000),
  ratePerEvent: z.number().int().positive().max(10_000_000),
});

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const hall = await createHall(parsed.data);
  return NextResponse.json(hall, { status: 201 });
}
