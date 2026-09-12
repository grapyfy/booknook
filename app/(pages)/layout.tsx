import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AppShell } from "@/components/AppShell";

// Real gate for this whole route group — was previously missing (middleware.ts's
// matcher only covers /dashboard and /login), which mattered less while these pages
// ran on mock data, but matters now that they call real services directly below.
//
// Regression fixed 2026-09-12: this unconditionally called createSupabaseServerClient(),
// which does `process.env.NEXT_PUBLIC_SUPABASE_URL!` with no guard — a `!` is just a
// TypeScript assertion, not a runtime check, so with no .env at all that crashed every
// page under this layout with a 500. That broke CLAUDE.md's explicit "build UI against
// mock data, zero .env needed" promise for anyone working UI-only. Skip the auth check
// entirely when Supabase isn't configured (matches the original no-.env UI workflow);
// enforce it for real the moment real credentials exist.
const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  if (supabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
