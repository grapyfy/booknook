import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listHalls, createHall } from "@/services/hallService";

export async function GET() {
  return NextResponse.json(await listHalls());
}

const schema = z.object({
  name: z.string().min(1).max(80),
  capacity: z.number().int().positive().max(100000),
  ratePerEvent: z.number().int().positive().max(10_000_000),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const hall = await createHall(parsed.data);
  return NextResponse.json(hall, { status: 201 });
}
