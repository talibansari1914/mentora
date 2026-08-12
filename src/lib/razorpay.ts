// ============================================================================
// src/lib/razorpay.ts
//
// Thin wrapper around Razorpay's REST API (no SDK dependency needed - it's
// just two endpoints: create an order, and verify a webhook signature).
//
// Required env vars (see .env.local):
//   RAZORPAY_KEY_ID       - also safe to expose to the client (it's public
//                            by design - Razorpay's checkout widget needs it)
//   RAZORPAY_KEY_SECRET   - server-side ONLY, never sent to the browser
//   RAZORPAY_WEBHOOK_SECRET - separate secret you set when configuring the
//                            webhook in the Razorpay dashboard. Server-side
//                            only. Do NOT reuse RAZORPAY_KEY_SECRET here -
//                            a dedicated webhook secret means a leak of one
//                            doesn't compromise the other.
// ============================================================================

import crypto from "crypto";

export const PLANS = {
  monthly: { amountPaise: 19900, label: "Premium - Monthly" }, // ₹199
  yearly: { amountPaise: 149900, label: "Premium - Yearly" }, // ₹1,499
} as const;

export type PlanId = keyof typeof PLANS;

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Creates a Razorpay Order for the given plan. The returned order id is
 * handed to the frontend, which opens Razorpay's Checkout widget with it -
 * the actual charge happens inside that widget, never through our own
 * form, so card details never touch our server.
 *
 * `userId` is embedded in the order's `notes` field so the webhook (which
 * only receives the order/payment IDs, not our session) can look up which
 * user to credit once payment is confirmed.
 */
export async function createOrder(planId: PlanId, userId: string): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET).");
  }

  const plan = PLANS[planId];
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: "INR",
      // Razorpay order receipts must be <= 40 chars.
      receipt: `mentora_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: userId, plan: planId },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verifies that a webhook payload genuinely came from Razorpay, using the
 * HMAC-SHA256 signature Razorpay sends in the `x-razorpay-signature`
 * header. This check is what makes the whole payment flow trustworthy -
 * without it, anyone who discovers the webhook URL could POST a fake
 * "payment succeeded" event and grant themselves Premium for free.
 *
 * `rawBody` MUST be the exact, unparsed request body string - signing is
 * byte-sensitive, so re-serializing a parsed JSON object here would
 * produce a different signature and reject every genuine webhook.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signatureHeader) return false;

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  // Constant-time comparison - a plain `===` here would leak timing
  // information an attacker could use to guess the signature byte by byte.
  const expected = Buffer.from(expectedSignature, "utf8");
  const actual = Buffer.from(signatureHeader, "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}