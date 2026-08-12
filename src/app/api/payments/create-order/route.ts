import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createOrder, PLANS, type PlanId } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in to upgrade." }, { status: 401 });
    }

    const { planId }: { planId?: string } = await req.json();
    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    const order = await createOrder(planId as PlanId, user.id);

    // Only the public key + order details go to the client - never the
    // secret key. The Razorpay Checkout widget needs exactly this much to
    // open the payment sheet.
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}