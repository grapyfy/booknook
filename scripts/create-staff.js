// Provisions a staff login — there's no public signup form (hotel staff don't self-register).
// Usage: node scripts/create-staff.js <email> <password> <name> <role>
// role is one of: OWNER, FRONT_DESK, ACCOUNTANT, HOUSEKEEPING_SUPERVISOR, HOUSEKEEPING_STAFF
// Calls Supabase's Admin REST API directly (not the supabase-js SDK — its realtime client
// needs a WebSocket polyfill under plain Node that isn't worth pulling in for a one-off script).

const { PrismaClient } = require("@prisma/client");

const [, , email, password, name, role = "OWNER"] = process.argv;

if (!email || !password || !name) {
  console.error("Usage: node scripts/create-staff.js <email> <password> <name> [role]");
  process.exit(1);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Supabase user creation failed:", data);
    process.exit(1);
  }

  const db = new PrismaClient();
  const staff = await db.staff.create({
    data: { supabaseUserId: data.id, name, email, role },
  });

  console.log("Created staff login:", staff);
  await db.$disconnect();
}

main();
