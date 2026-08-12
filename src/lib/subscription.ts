// ============================================================================
// src/lib/subscription.ts
//
// Reads (never writes) a user's subscription status. Writing only ever
// happens from the Razorpay webhook (src/app/api/payments/webhook/route.ts)
// via the service-role client - this file is safe to call from any
// authenticated route since it only performs a read the user's own RLS
// policy already allows.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

// Raw Supabase row shape (snake_case) for the `subscriptions` table — see
// the migration of the same name for the `plan`/`status` CHECK constraints
// this mirrors.
interface SubscriptionRow {
  plan: "free" | "premium";
  status: "active" | "expired" | "cancelled";
  current_period_end: string | null;
}

export async function isPremiumUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  // No row yet (never subscribed) or a query error - both just mean "not
  // premium", never an error to surface to the caller. Usage-limit checks
  // must never fail an AI request just because this optional lookup had a
  // hiccup.
  if (error || !data) return false;

  const row = data as SubscriptionRow;

  if (row.plan !== "premium" || row.status !== "active") return false;
  if (!row.current_period_end) return false;

  return new Date(row.current_period_end).getTime() > Date.now();
}