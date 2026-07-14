"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Profile {
  email: string | null;
  subscription_tier: string;
  subscription_status: string;
  current_period_end: string | null;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=account");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
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
    // Redirect to Stripe customer portal
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

  const isPremium = profile?.subscription_tier === "premium";

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your subscription</p>

        {/* Profile */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">Email</p>
              <p className="mt-1 text-sm font-medium">{profile?.email ?? "Unknown"}</p>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase ${isPremium ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}
            >
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>
        </div>

        {/* Subscription */}
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          {isPremium ? (
            <>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-accent" strokeWidth="1.5">
                  <path d="M12 2L15 8.5L22 9.3L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.3L9 8.5L12 2Z" />
                </svg>
                <h3 className="text-sm font-semibold">Premium Active</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Status: <span className="font-medium capitalize text-foreground">{profile?.subscription_status}</span>
              </p>
              {profile?.current_period_end && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renews: <span className="font-medium text-foreground">{new Date(profile.current_period_end).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </p>
              )}
              <button
                onClick={handleManageBilling}
                className="mt-4 w-full rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Manage billing / Cancel
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold">Free Plan</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                You're on the free plan. Upgrade to unlock the SPR barrel, full history, and more.
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

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          Sign out
        </button>

        <a href="/dashboard" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
