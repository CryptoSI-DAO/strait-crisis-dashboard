"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) { setError(error.message); setLoading(false); }
      else { setSent(true); setLoading(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { window.location.href = "/dashboard"; }
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setSent(true); setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex w-16 justify-center text-primary">
            <Logo size={56} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Strait Crisis Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Check your inbox" : isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
            <p className="text-sm font-medium text-success">Magic link sent!</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We sent a secure link to <span className="font-mono text-foreground">{email}</span>.
              Click it to continue.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex rounded-lg border border-border bg-background p-0.5">
              <button
                onClick={() => { setMode("password"); setError(null); }}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                  mode === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { setMode("magic"); setError(null); }}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                  mode === "magic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Magic Link
              </button>
            </div>

            {mode === "password" ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send magic link"}
                </button>
                <p className="text-center text-[0.65rem] text-muted-foreground/60">
                  We'll email you a secure one-time link. No password needed.
                </p>
              </form>
            )}
          </>
        )}

        <div className="mt-8 rounded-lg border border-border bg-card/50 p-4">
          <p className="text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Free:</span> Threat level, prices, charts<br />
            <span className="font-semibold text-accent">Premium ($4.99/mo):</span> SPR, 90-day history, all metrics
          </p>
        </div>
      </div>
    </main>
  );
}
