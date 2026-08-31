"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-neutral-900">
      Logout
    </button>
  );
}
