import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listChannels, upsertChannel } from "@/services/channelService";
import { requireStaff } from "@/lib/require-staff";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  return NextResponse.json(await listChannels());
}

const schema = z.object({
  name: z.string().min(1).max(80),
  status: z.enum(["NOT_CONNECTED", "IN_PROGRESS", "CONNECTED"]),
  notes: z.string().max(1000).optional(),
});

// Real CRUD, but "CONNECTED" is a manual status flag, not a live OTA sync — see
// the Channel model's schema comment and CLAUDE.md's OTA integration section.
export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const channel = await upsertChannel(parsed.data);
  return NextResponse.json(channel, { status: 201 });
}
