"use client";

import { useState } from "react";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

type PlanId = "monthly" | "yearly";

const PLAN_DISPLAY: Record<PlanId, { price: string; period: string; note?: string }> = {
  monthly: { price: "₹199", period: "/month" },
  yearly: { price: "₹1,499", period: "/year", note: "Save 37% vs monthly" },
};

const PREMIUM_PERKS = [
  "3x higher daily AI limits on every feature",
  "Video to Notes - unlocked",
  "Audio Revision - unlocked",
  "Priority access during high-traffic hours",
];

const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  subText: "var(--theme-text-sub)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
};

// Shape of the Razorpay Checkout constructor's options and the instance it
// returns — only the fields/methods this page actually uses. Razorpay
// doesn't ship its own TS types (it's loaded as a plain <script> tag, not
// an npm package), hence declaring this ourselves instead of importing it.
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}

interface RazorpayCheckoutInstance {
  on(event: string, handler: () => void): void;
  open(): void;
}

interface RazorpayWindow {
  Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
}

// Shape of the JSON body returned by /api/payments/create-order.
interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  error?: string;
}

// Loads Razorpay's checkout script exactly once, reusing it on later calls
// instead of injecting a duplicate <script> tag every time the user clicks
// a plan button.
let razorpayScriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if ((window as unknown as RazorpayWindow).Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment gateway. Check your connection."));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

export default function UpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpgrade(planId: PlanId) {
    if (loadingPlan) return; // Guard against double-click firing two checkouts
    setLoadingPlan(planId);
    setError(null);

    try {
      await loadRazorpayScript();

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const order = (await res.json()) as CreateOrderResponse;
      if (!res.ok) throw new Error(order.error ?? "Could not start checkout.");

      // Non-null assertion: loadRazorpayScript() above has already
      // resolved, which only happens once window.Razorpay is set.
      const razorpay = new ((window as unknown as RazorpayWindow).Razorpay!)({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Mentora Premium",
        description: PLAN_DISPLAY[planId].price + PLAN_DISPLAY[planId].period,
        theme: { color: "#F59E0B" },
        handler: () => {
          // Payment captured on Razorpay's side. Actual Premium activation
          // happens server-side via the webhook (src/app/api/payments/
          // webhook/route.ts) once Razorpay confirms it there too - that
          // usually lands within a couple of seconds, so we just show a
          // success message rather than claiming access is live this
          // instant.
          setSuccess(true);
          setLoadingPlan(null);
        },
        modal: {
          ondismiss: () => setLoadingPlan(null), // User closed the checkout without paying
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed. No amount was charged - please try again.");
        setLoadingPlan(null);
      });

      razorpay.open();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
      setLoadingPlan(null);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.color, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "10px" }}>Payment received!</h1>
          <p style={{ color: themeStyles.subText, marginBottom: "20px" }}>
            Your Premium access is activating now - it'll be live within a minute or two. If it isn't showing yet, just refresh the dashboard shortly.
          </p>
          <a href="/dashboard" style={{ color: "var(--theme-accent, #F59E0B)", fontWeight: 700, textDecoration: "none" }}>
            Back to Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.color, fontFamily: "'DM Sans',sans-serif", padding: "clamp(16px, 4vw, 32px)" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <BackToDashboardLink />
        <header style={{ marginBottom: "28px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 800, marginBottom: "8px" }}>
            Go <span style={G.gradText}>Premium</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Unlock higher AI limits and every tool, on any exam.
          </p>
        </header>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", textAlign: "center", marginBottom: "16px" }}>{error}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {(Object.keys(PLAN_DISPLAY) as PlanId[]).map((planId) => {
            const plan = PLAN_DISPLAY[planId];
            const isLoading = loadingPlan === planId;
            return (
              <div key={planId} style={{ background: themeStyles.cardBg, border: themeStyles.cardBorder, borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                <p style={{ color: themeStyles.subText, fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                  {planId === "monthly" ? "Monthly" : "Yearly"}
                </p>
                <p style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "4px" }}>
                  {plan.price}
                  <span style={{ fontSize: ".9rem", fontWeight: 600, color: themeStyles.subText }}>{plan.period}</span>
                </p>
                {plan.note && (
                  <p style={{ color: "#22C55E", fontSize: ".78rem", fontWeight: 700, marginBottom: "14px" }}>{plan.note}</p>
                )}
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={loadingPlan !== null}
                  style={{
                    width: "100%",
                    background: G.grad,
                    border: "none",
                    color: "var(--theme-accent-text)",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: loadingPlan !== null ? "not-allowed" : "pointer",
                    opacity: loadingPlan !== null && !isLoading ? 0.5 : 1,
                    fontWeight: 700,
                    fontSize: ".9rem",
                    marginTop: plan.note ? 0 : "18px",
                  }}
                >
                  {isLoading ? "Opening checkout..." : "Choose this plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ background: themeStyles.cardBg, border: themeStyles.cardBorder, borderRadius: "16px", padding: "22px" }}>
          <p style={{ fontWeight: 700, marginBottom: "12px" }}>What you get with Premium</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {PREMIUM_PERKS.map((perk) => (
              <li key={perk} style={{ color: themeStyles.subText, fontSize: ".88rem", display: "flex", gap: "8px" }}>
                <span style={{ color: "#22C55E" }}>✓</span> {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}