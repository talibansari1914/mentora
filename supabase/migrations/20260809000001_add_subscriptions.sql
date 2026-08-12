-- Adds Premium subscription support (Razorpay-backed).
--
-- Design notes:
-- - One row per user, upserted on each successful payment. We don't need
--   a full billing-history table for a v1 - "what plan is this user on
--   right now" is all the app actually checks (see src/lib/usageLimit.ts
--   and src/lib/subscription.ts).
-- - Client code (anon/authenticated) can only ever READ its own row.
--   ALL writes happen through the Razorpay webhook handler
--   (src/app/api/payments/webhook/route.ts), which uses the Supabase
--   service_role key server-side - never the user's own session. This
--   means a client can never grant itself Premium by calling the table
--   directly, only a verified Razorpay webhook payload can.
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "user_id" "uuid" NOT NULL,
    "plan" "text" NOT NULL DEFAULT 'free',
    "status" "text" NOT NULL DEFAULT 'active',
    "razorpay_customer_id" "text",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "subscriptions_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'premium'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'cancelled'::"text"])))
);

ALTER TABLE "public"."subscriptions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

-- Users may read only their own subscription row.
CREATE POLICY "Users can view own subscription" ON "public"."subscriptions"
    FOR SELECT USING (("auth"."uid"() = "user_id"));

-- Deliberately NO insert/update/delete policy for anon/authenticated -
-- same "RLS enabled, zero write policies = writes blocked by default"
-- pattern already used for usage_limits (see
-- 20260808_lock_down_usage_limits_table.sql). Only service_role (used by
-- the webhook route, never exposed to the browser) can write here.

GRANT SELECT ON TABLE "public"."subscriptions" TO "authenticated";
-- No grant to "anon" at all - an unauthenticated request has no reason to
-- read subscription rows, and RLS would block it even if it tried.