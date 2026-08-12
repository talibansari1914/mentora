-- Part 1: usage_limits table itself is only ever touched through the
-- SECURITY DEFINER RPC (try_increment_usage), never directly by client
-- code — so anon/authenticated have no legitimate reason to hold
-- table-level grants on it at all.
REVOKE ALL ON TABLE "public"."usage_limits" FROM "anon";
REVOKE ALL ON TABLE "public"."usage_limits" FROM "authenticated";

-- Part 2: gap-fill from migration 20260807000001 — that migration's
-- REVOKE on the try_increment_usage function itself did not get applied
-- to the remote database when the rest of that migration was (verified
-- via has_function_privilege(), which returned true for anon before this).
-- Re-running it here is safe and idempotent even if it did apply.
REVOKE ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) FROM "anon";