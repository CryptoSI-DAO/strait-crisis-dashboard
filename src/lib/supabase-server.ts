import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware will refresh the session
          }
        },
      },
    },
  );
}

// Get current user + subscription tier
export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    tier: (profile?.subscription_tier as "free" | "premium") ?? "free",
    subscriptionStatus: (profile?.subscription_status as string) ?? "none",
    stripeCustomerId: profile?.stripe_customer_id ?? null,
    currentPeriodEnd: profile?.current_period_end ?? null,
  };
}

export type User = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
