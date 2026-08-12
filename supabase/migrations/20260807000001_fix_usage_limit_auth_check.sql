-- Fix: try_increment_usage allowed any caller to pass an arbitrary
-- p_user_id and increment/exhaust another user's daily usage count,
-- since the function is SECURITY DEFINER (bypasses RLS) and never
-- checked p_user_id against the calling session's own auth.uid().
--
-- This patch adds that check. It is safe to apply because:
--   - The only caller in the app (src/lib/usageLimit.ts) already
--     always passes p_user_id = the current session's own user id
--     (obtained from supabase.auth.getUser() in each API route),
--     so normal app behavior is completely unchanged.
--   - It only blocks a caller from passing someone ELSE's user id.
--   - CREATE OR REPLACE FUNCTION only swaps the function body; it does
--     not touch the usage_limits table, its data, or any other table,
--     function, or feature.

CREATE OR REPLACE FUNCTION "public"."try_increment_usage"(
  "p_user_id" "uuid",
  "p_feature" "text",
  "p_date" "date",
  "p_feature_limit" integer,
  "p_total_limit" integer
) RETURNS TABLE("allowed" boolean, "feature_count" integer, "total_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_total_count int;
  v_feature_count int;
begin
  -- NEW: refuse to act on behalf of anyone other than the caller.
  if p_user_id is distinct from auth.uid() then
    raise exception 'p_user_id must match the authenticated user';
  end if;

  -- Serialize all calls for this (user, date) so the read below
  -- always sees the effect of any write from a call that started
  -- earlier — closes the race window.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text || p_date::text));

  select coalesce(sum(count), 0) into v_total_count
  from usage_limits
  where user_id = p_user_id and date = p_date;

  select coalesce(count, 0) into v_feature_count
  from usage_limits
  where user_id = p_user_id and feature = p_feature and date = p_date;

  if v_feature_count >= p_feature_limit or v_total_count >= p_total_limit then
    return query select false, v_feature_count, v_total_count;
    return;
  end if;

  insert into usage_limits (user_id, feature, date, count)
  values (p_user_id, p_feature, p_date, 1)
  on conflict (user_id, feature, date)
  do update set count = usage_limits.count + 1
  returning usage_limits.count into v_feature_count;

  return query select true, v_feature_count, v_total_count + 1;
end;$$;

ALTER FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) OWNER TO "postgres";

-- Also tighten grants: anon (non-logged-in) callers have no legitimate
-- reason to call this RPC at all, since it's only ever used right after
-- an auth check in the app's API routes.
REVOKE ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) FROM "anon";