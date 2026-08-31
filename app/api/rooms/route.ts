import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listRooms, createRoom } from "@/services/roomService";

export async function GET() {
  const rooms = await listRooms();
  return NextResponse.json(rooms);
}

const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  roomType: z.string().min(1).max(60),
  ratePerNight: z.number().int().positive().max(1000000),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createRoomSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const room = await createRoom(parsed.data);
    return NextResponse.json(room, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Room number already exists" }, { status: 409 });
  }
}
