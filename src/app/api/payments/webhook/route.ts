import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyWebhookSignature, PLANS, type PlanId } from "@/lib/razorpay";

// Razorpay calls this route directly (server-to-server), never through a
// logged-in user's browser session - so this uses the Supabase
// SERVICE ROLE key, not the cookie-based client every other route uses.
// That's what lets it write to `subscriptions`, which regular
// authenticated users can only read (see the migration's RLS policy).
// SUPABASE_SERVICE_ROLE_KEY must be set in env - it is never exposed to
// the client and must never be prefixed with NEXT_PUBLIC_.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Shape of a Razorpay webhook payload — external, untrusted JSON, so this
// only describes the fields this handler actually reads (event type, and
// the captured payment's id/order_id/notes). Razorpay's real payload has
// many more fields we don't need.
interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: {
          user_id?: string;
          plan?: string;
        };
      };
    };
  };
}

export async function POST(req: NextRequest) {
  // Signature verification needs the EXACT raw body bytes Razorpay signed -
  // req.json() would re-serialize and break the signature, so read text
  // first and parse manually.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[payments/webhook] Signature verification failed - rejecting.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  // We only act on a captured payment - Razorpay sends several other
  // event types (order.paid, payment.failed, etc.) we don't need to
  // handle for a simple one-time-order-per-renewal model.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderNotes = payment?.notes ?? {};
  const userId: string | undefined = orderNotes.user_id;
  // orderNotes.plan is unchecked external data (string | undefined) here —
  // narrowed to PlanId by the `planId in PLANS` check right below, same as
  // this line already relied on before it had an explicit type.
  const planId = orderNotes.plan as PlanId | undefined;

  if (!userId || !planId || !(planId in PLANS)) {
    console.error("[payments/webhook] Captured payment missing user_id/plan in notes:", payment?.id);
    // Still 200 - Razorpay retries on non-2xx, and retrying won't fix a
    // payload that's missing data we never sent in the first place.
    return NextResponse.json({ received: true, warning: "missing order notes" });
  }

  const periodDays = planId === "yearly" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getServiceClient();
  // Non-null assertions: `payment` is guaranteed defined here — if it
  // weren't, `orderNotes` above would be `{}`, making userId/planId both
  // undefined and returning early at the check above, before this point.
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "premium",
      status: "active",
      razorpay_order_id: payment!.order_id,
      razorpay_payment_id: payment!.id,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[payments/webhook] Failed to upsert subscription:", error);
    // 500 here IS intentional (unlike the missing-notes case above) -
    // this is a transient DB failure, and Razorpay's automatic retry can
    // succeed on a later attempt once the DB is healthy again.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}