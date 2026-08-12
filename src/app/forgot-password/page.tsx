"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/authService";
import { Turnstile } from "@/components/auth/Turnstile";
import { getErrorMessage } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    background: "#161f31",
    border: "1px solid #2d3748",
    borderRadius: "14px",
    outline: "none",
    fontSize: "0.9rem",
    color: "white",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.resetPassword(email, captchaToken);
      // Always show the same success state whether or not the email is
      // registered — this avoids leaking which emails have an account
      // (the same reason the message below is phrased generically).
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
      // Turnstile tokens are single-use - clear it so a retry after a
      // failed attempt waits for the widget to issue a fresh token.
      setCaptchaToken(undefined);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5a623",
        padding: "20px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0b0f17",
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          padding: "44px 36px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail size={18} style={{ color: "#111827" }} />
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em", color: "white" }}>Mentora</span>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={40} style={{ color: "#22C55E", marginBottom: "14px" }} />
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginBottom: "10px" }}>
              Check your email
            </h1>
            <p style={{ color: "#a0aec0", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "24px" }}>
              If an account exists for <strong style={{ color: "white" }}>{email}</strong>, we&apos;ve sent a link to reset your password. It may take a minute to arrive.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#f59e0b",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", color: "white", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Forgot Password?
            </h1>
            <p style={{ color: "#a0aec0", fontSize: "0.85rem", textAlign: "center", marginBottom: "24px", lineHeight: 1.5 }}>
              Enter the email linked to your account and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px", fontSize: "0.8rem", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={inputStyle}
              />

              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(undefined)}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "20px",
                  boxShadow: "5px 5px 10px rgba(0,0,0,0.2), -5px -5px 10px rgba(255,255,255,0.1)",
                  color: "#1e293b",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "SENDING..." : "SEND RESET LINK"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <Link href="/login" style={{ color: "#a0aec0", fontSize: "0.8rem", textDecoration: "none" }}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}