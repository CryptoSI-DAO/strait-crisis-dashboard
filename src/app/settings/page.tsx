"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardHeader } from "@/components/dashboard-header";
import { BottomNav } from "@/components/bottom-nav";

interface Profile {
  email: string | null;
  subscription_tier: string;
  subscription_status: string;
  current_period_end: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=settings");
        return;
      }

      const { data } = await supabase
        .from("strait_profiles")
        .select("email, subscription_tier, subscription_status, current_period_end")
        .eq("id", session.user.id)
        .single();

      setProfile(data as Profile | null);
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleManageBilling() {
    const resp = await fetch("/api/stripe/portal", { method: "POST" });
    if (resp.ok) {
      const { url } = await resp.json();
      window.location.href = url;
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  const isPremium = profile?.subscription_tier === "premium" || profile?.subscription_tier === "admin";
  const isAdmin = profile?.subscription_tier === "admin";

  // Calculate days until renewal
  let daysUntilRenewal: number | null = null;
  let renewalDate: string | null = null;
  if (profile?.current_period_end) {
    const end = new Date(profile.current_period_end);
    const now = new Date();
    daysUntilRenewal = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    renewalDate = end.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <DashboardHeader user={null} />

      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferences & subscription</p>

        {/* Appearance */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <h3 className="text-sm font-semibold">Appearance</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Subscription */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            <h3 className="text-sm font-semibold">Subscription</h3>
          </div>

          {/* Tier badge */}
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">Current Plan</span>
            <span
              className={`rounded-md px-2.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase ${
                isAdmin
                  ? "bg-primary/15 text-primary"
                  : isPremium
                  ? "bg-accent/15 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}
            </span>
          </div>

          {isPremium ? (
            <>
              {/* Status + renewal */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">Status</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                    <span className="capitalize text-success">{profile?.subscription_status}</span>
                  </span>
                </div>

                {renewalDate && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">Renews</span>
                      <span className="text-xs font-medium text-foreground">{renewalDate}</span>
                    </div>

                    {/* Renewal countdown */}
                    <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.55rem] tracking-wider text-muted-foreground uppercase">Days Until Renewal</span>
                        <span
                          className={`font-mono text-lg font-black ${
                            daysUntilRenewal !== null && daysUntilRenewal <= 3
                              ? "text-danger"
                              : daysUntilRenewal !== null && daysUntilRenewal <= 7
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {daysUntilRenewal}
                        </span>
                      </div>
                      {/* Progress bar showing time elapsed in cycle */}
                      {daysUntilRenewal !== null && daysUntilRenewal >= 0 && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, (1 - daysUntilRenewal / 30) * 100))}%`,
                              backgroundColor:
                                daysUntilRenewal <= 3 ? "var(--color-danger)" : daysUntilRenewal <= 7 ? "var(--color-warning)" : "var(--color-success)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!renewalDate && isAdmin && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Admin access — no renewal required.
                  </p>
                )}

                <button
                  onClick={handleManageBilling}
                  className="mt-4 w-full rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  Manage billing / Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs text-muted-foreground">
                You're on the free plan. Upgrade to unlock the SPR barrel, 90-day history, and all metrics.
              </p>
              <a
                href="/upgrade"
                className="mt-4 block w-full rounded-lg bg-accent px-4 py-2 text-center text-xs font-bold text-accent-foreground transition hover:opacity-90"
              >
                Upgrade to Premium — $4.99/mo
              </a>
            </>
          )}
        </div>

        {/* Community — Telegram */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4 fill-[#29a9eb]" strokeWidth="0">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <h3 className="text-sm font-semibold">Community</h3>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Join the Strait Crisis Telegram channel for real-time alerts, analysis, and discussion.
          </p>
          <a
            href="https://t.me/straitcrisis"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#29a9eb] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-white" strokeWidth="0">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Join Telegram Channel
          </a>
        </div>

        {/* Account */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
            <h3 className="text-sm font-semibold">Account</h3>
          </div>
          <div className="mt-3">
            <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">Email</p>
            <p className="mt-1 text-sm font-medium">{profile?.email ?? "Unknown"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
