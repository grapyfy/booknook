// Supabase, browser side — used only for auth (login/session), not for data queries.
// All real data reads/writes go through our own API routes (see app/api/), which use
// Prisma with the service role — the browser never talks to the database directly.
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
