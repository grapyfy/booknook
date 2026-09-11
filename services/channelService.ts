import { db } from "@/lib/db";

// Real CRUD, but "CONNECTED" here means "outreach/setup is done," not a live two-way
// sync with the OTA's servers — see the schema comment on the Channel model and
// CLAUDE.md's "OTA integration" section (BD/outreach track vs. engineering track).
// Never wire this to a real MakeMyTrip/Goibibo API call without that access confirmed.
export async function listChannels() {
  return db.channel.findMany({ orderBy: { name: "asc" } });
}

export async function upsertChannel(input: { name: string; status: "NOT_CONNECTED" | "IN_PROGRESS" | "CONNECTED"; notes?: string }) {
  return db.channel.upsert({
    where: { name: input.name },
    create: input,
    update: { status: input.status, notes: input.notes },
  });
}
