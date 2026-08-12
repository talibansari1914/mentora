// ============================================================================
// src/lib/usageLimit.ts
//
// Enforces per-user daily AI usage limits, both:
//   1. Per-feature limit (e.g. video-notes: 5/day)
//   2. Combined total limit across all features (25/day)
//
// A single Postgres RPC call (try_increment_usage) performs the check and
// the increment atomically in one round trip and one transaction - no
// separate read-then-write, no race condition under concurrent requests.
// See supabase_usage_limits.sql for the migration this depends on.
//
// Adding a new feature: add one entry to FEATURE_LIMITS.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { isPremiumUser } from "./subscription";

// Per-feature daily limits. Any feature not listed here falls back to
// DEFAULT_FEATURE_LIMIT, so a new route added without an explicit entry
// doesn't silently become unlimited.
export const FEATURE_LIMITS: Record<string, number> = {
  "ai-tutor": 12,
  "writing-assistant": 12,
  "generate-notes": 12,
  "generate-practice": 12,
  "code-mentor": 12,
  "book-tools": 12,
  "video-notes": 5,
  "mock-test-analysis": 5,
};

const DEFAULT_FEATURE_LIMIT = 10;

export const TOTAL_DAILY_LIMIT = 25;

// Premium multiplies every limit rather than going fully "unlimited" - a
// generous-but-bounded cap (3x = 36/day feature, 75/day total) covers
// every realistic usage pattern (a highly engaged user doing ~15
// generations/day costs ~₹150/month in raw AI - comfortably under the
// ₹199 price) while still bounding worst-case exposure if an account is
// ever scripted against or an unusually heavy user sustains the cap daily
// (~₹740/month at absolute worst case). No capped-AI-subscription model
// can make its theoretical worst-case profitable - the cap exists to
// bound abuse, not to describe expected usage. Monitor real per-user AI
// spend after launch and tune this constant down if actual costs run
// high relative to revenue.
export const PREMIUM_MULTIPLIER = 3;

export interface UsageCheckResult {
  allowed: boolean;
  featureCount: number;
  totalCount: number;
  featureLimit: number;
  totalLimit: number;
}

/**
 * Checks today's usage for this user + feature and, if allowed, increments
 * the count in the same atomic operation. Only call this when an AI call is
 * actually about to be made - it has a side effect.
 */
export async function checkAndIncrementUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<UsageCheckResult> {
  const premium = await isPremiumUser(supabase, userId);
  const multiplier = premium ? PREMIUM_MULTIPLIER : 1;
  const featureLimit = (FEATURE_LIMITS[feature] ?? DEFAULT_FEATURE_LIMIT) * multiplier;
  const totalLimit = TOTAL_DAILY_LIMIT * multiplier;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC

  const { data, error } = await supabase
    .rpc("try_increment_usage", {
      p_user_id: userId,
      p_feature: feature,
      p_date: today,
      p_feature_limit: featureLimit,
      p_total_limit: totalLimit,
    })
    .single();

  if (error) {
    // Fail open: if the DB/RPC is unreachable, blocking every AI feature
    // app-wide would be a worse outcome than temporarily skipping the
    // usage check for this one request. Logged for visibility.
    console.error("[usageLimit] RPC failed, failing open:", error);
    return {
      allowed: true,
      featureCount: 0,
      totalCount: 0,
      featureLimit,
      totalLimit,
    };
  }

  const result = data as { allowed: boolean; feature_count: number; total_count: number };

  return {
    allowed: result.allowed,
    featureCount: result.feature_count,
    totalCount: result.total_count,
    featureLimit,
    totalLimit,
  };
}