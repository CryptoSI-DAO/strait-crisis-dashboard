"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter, usePathname } from "next/navigation";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  function handleClose() {
    setSent(false);
    setEmail("");
    setError(null);
    onClose();
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
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-primary" strokeWidth="2">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M2 7l10 5 10-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            {sent ? "Check your inbox" : "Sign in or create account"}
          </h2>
        </div>

        {sent ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
            <p className="text-sm font-medium text-success">Magic link sent!</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We sent a secure link to <span className="font-mono text-foreground">{email}</span>.
              Click it to continue to the dashboard.
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
          </form>
        )}

        <div className="mt-6 rounded-lg border border-border bg-background/50 p-3">
          <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Free:</span> Threat level, prices, charts<br />
            <span className="font-semibold text-accent">Premium ($4.99/mo):</span> SPR, 90-day history, all metrics
          </p>
        </div>

        <p className="mt-3 text-center text-[0.6rem] text-muted-foreground/60">
          No password. Secure magic links via email.
        </p>
      </div>
    </div>
  );
}
