import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AppShell } from "@/components/AppShell";

// Real gate for this whole route group — was previously missing (middleware.ts's
// matcher only covers /dashboard and /login), which mattered less while these pages
// ran on mock data, but matters now that they call real services directly below.
export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
