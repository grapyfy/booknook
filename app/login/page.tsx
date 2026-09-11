"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("grap_remembered_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError("Email ya password galat hai.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("grap_remembered_email", email);
    } else {
      localStorage.removeItem("grap_remembered_email");
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleDemoLogin() {
    setError(null);
    setLoading(true);
    const demoEmail = "demo@hotel.com";
    const demoPassword = "demo123456";

    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    setLoading(false);
    if (error) {
      setError("Demo account not found. Create it in Supabase first, or wire real Supabase credentials.");
      return;
    }

    localStorage.setItem("grap_remembered_email", demoEmail);
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border border-neutral-300"
          />
          <span className="text-sm text-neutral-600">Email yaad rakho</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Button
            type="button"
            disabled={loading}
            variant="secondary"
            onClick={handleDemoLogin}
            className="flex-1"
          >
            Demo
          </Button>
        </div>
      </form>
    </main>
  );
}
