"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError("Email ya password galat hai."); // staff-facing copy stays simple/Hindi-friendly per project norms
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-neutral-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-8"
      >
        <div className="mb-2 flex flex-col items-center text-center gap-2">
          <span className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
            B
          </span>
          <h1 className="text-xl font-semibold">GRAP</h1>
          <p className="text-sm text-neutral-500">Front desk login</p>
        </div>
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            placeholder="you@hotel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </main>
  );
}
