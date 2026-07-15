"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"magic" | "password">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function resetState() {
    setSent(false);
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

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
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          {/* Logo */}
          <div className="mx-auto mb-3 w-16">
            <svg viewBox="0 0 80 80" className="w-full">
              {/* Strait shape — narrow waterway between two landmasses */}
              <path d="M8 12 L30 12 Q36 12 36 18 L36 30 Q36 36 30 36 L26 36 Q22 36 22 40 L22 44 Q22 48 26 48 L34 48 Q40 48 40 54 L40 68" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M72 12 L50 12 Q44 12 44 18 L44 30 Q44 36 50 36 L54 36 Q58 36 58 40 L58 44 Q58 48 54 48 L46 48 Q40 48 40 54 L40 68" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              <circle cx="40" cy="54" r="3" fill="var(--color-warning)" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            {sent ? "Check your inbox" : isSignUp ? "Create account" : "Welcome back"}
          </h2>
        </div>

        {sent ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
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
            {/* Mode toggle */}
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
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label className="mb-1.5 block font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

        <div className="mt-6 rounded-lg border border-border bg-background/50 p-3">
          <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Free:</span> Threat level, prices, charts<br />
            <span className="font-semibold text-accent">Premium ($4.99/mo):</span> SPR, 90-day history, all metrics
          </p>
        </div>
      </div>
    </div>
  );
}
