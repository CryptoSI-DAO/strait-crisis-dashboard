"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-primary" strokeWidth="2">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M2 7l10 5 10-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Strait Crisis Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Check your inbox" : "Sign in or create account"}
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
            <p className="text-sm font-medium text-success">
              Magic link sent!
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We sent a sign-in link to <span className="font-mono text-foreground">{email}</span>.
              Click the link in the email to continue.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}

        <div className="mt-8 rounded-lg border border-border bg-card/50 p-4">
          <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Free account:</span> Threat level, prices, charts, tanker index<br />
            <span className="font-semibold text-accent">Premium ($4.99/mo):</span> SPR barrel, full history, alerts
          </p>
        </div>

        <p className="mt-4 text-center text-[0.65rem] text-muted-foreground/60">
          No password needed. We use secure magic links via email.
        </p>
      </div>
    </main>
  );
}
