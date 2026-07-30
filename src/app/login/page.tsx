"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnconfirmedEmail(false);
    setResendStatus("idle");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(true);
      }
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResendStatus("sending");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendStatus(error ? "idle" : "sent");
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  // Shared style for input fields to keep them consistent in dark mode
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    background: "#161f31", // Dark input background
    border: "1px solid #2d3748", // Dark border
    borderRadius: "14px",
    outline: "none",
    fontSize: "0.9rem",
    color: "white",
    boxSizing: "border-box"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5a623", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Main Split Card Container (Swapped Order for Desktop) */}
      <div className="login-container" style={{ width: "100%", maxWidth: "900px", minHeight: "540px", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#0b0f17", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>

        {/* NEW LEFT PANEL: Mentora Text & Stats (Previously Right) */}
        <div style={{ background: "#f59e0b", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "36px 32px", color: "#111827", boxSizing: "border-box" }}>
          
          {/* Top Branding & Quote */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} style={{ color: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>Mentora</span>
            </div>

            <div style={{ borderLeft: "3px solid #111827", paddingLeft: "12px", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.85rem", fontStyle: "italic", lineHeight: 1.4, color: "#111827", marginBottom: "4px" }}>
                &ldquo;Success is the sum of small efforts, repeated day in and day out.&rdquo;
              </p>
              <span style={{ fontSize: "0.75rem", color: "rgba(17, 24, 39, 0.7)", fontWeight: 600 }}>&mdash; Robert Collier</span>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
              <div style={{ background: "rgba(17, 24, 39, 0.1)", backdropFilter: "blur(4px)", padding: "10px 8px", borderRadius: "12px", textAlign: "center" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", margin: 0 }}>50K+</h4>
                <p style={{ fontSize: "0.65rem", color: "rgba(17, 24, 39, 0.8)", margin: 0, fontWeight: 600 }}>Students</p>
              </div>
              <div style={{ background: "rgba(17, 24, 39, 0.1)", backdropFilter: "blur(4px)", padding: "10px 8px", borderRadius: "12px", textAlign: "center" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", margin: 0 }}>10K+</h4>
                <p style={{ fontSize: "0.65rem", color: "rgba(17, 24, 39, 0.8)", margin: 0, fontWeight: 600 }}>Materials</p>
              </div>
              <div style={{ background: "rgba(17, 24, 39, 0.1)", backdropFilter: "blur(4px)", padding: "10px 8px", borderRadius: "12px", textAlign: "center" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", margin: 0 }}>500+</h4>
                <p style={{ fontSize: "0.65rem", color: "rgba(17, 24, 39, 0.8)", margin: 0, fontWeight: 600 }}>Mock Tests</p>
              </div>
            </div>
          </div>

          {/* Bottom Action (Sign Up Link) */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(17, 24, 39, 0.85)", marginBottom: "10px" }}>
              New Here?
            </p>
            <Link href="/signup" style={{ display: "inline-block", width: "100%", padding: "12px 24px", background: "rgba(17, 24, 39, 0.1)", border: "1px solid rgba(17, 24, 39, 0.2)", borderRadius: "24px", color: "#111827", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none", letterSpacing: "0.08em", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}>
              SIGN UP
            </Link>
          </div>
        </div>

        {/* NEW RIGHT PANEL: Sign In Form (Dark Mode - Previously Left) */}
        <div style={{ padding: "44px 36px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#0b0f17", boxSizing: "border-box" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", color: "white", marginBottom: "20px", letterSpacing: "-0.02em" }}>Sign in</h1>

          {/* Social Icons (Dark Mode Styled) */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
            <button type="button" onClick={handleGoogle} style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#161f31", border: "1px solid #2d3748", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white" }} title="Facebook">
              f
            </button>
            <button type="button" onClick={handleGoogle} style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#161f31", border: "1px solid #2d3748", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white" }} title="Google">
              G
            </button>
            <button type="button" onClick={handleGoogle} style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#161f31", border: "1px solid #2d3748", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white" }} title="GitHub">
              &lt;&gt;
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px", fontSize: "0.8rem", color: "#f87171" }}>
              {unconfirmedEmail ? (
                <>
                  Email not verified.
                  <button type="button" onClick={handleResendConfirmation} style={{ background: "none", border: "none", color: "#fca5a5", textDecoration: "underline", cursor: "pointer", marginLeft: "6px" }}>Resend</button>
                </>
              ) : error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ width: "100%" }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
            </div>

            <div style={{ width: "100%", position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{...inputStyle, paddingRight: "42px"}} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a0aec0", display: "flex", alignItems: "center" }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "6px", width: "100%" }}>
              <button type="submit" disabled={loading} style={{ width: "140px", padding: "12px", background: "#f1f5f9", border: "none", borderRadius: "20px", boxShadow: "5px 5px 10px rgba(0,0,0,0.2), -5px -5px 10px rgba(255,255,255,0.1)", color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}>
                {loading ? "LOADING..." : "SIGN IN"}
              </button>
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <Link href="/forgot-password" style={{ color: "#a0aec0", fontSize: "0.8rem", textDecoration: "none" }}>
              Forgot your password?
            </Link>
          </div>
        </div>

      </div>

      <style jsx>{`
        @media(max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr !important;
            /* On mobile, we want the form to be on top, so we change the flex direction by reversing the grid */
          }
          .login-container > div:first-child {
            /* Mentora block becomes bottom */
            order: 2;
          }
          .login-container > div:last-child {
            /* Form block becomes top */
            order: 1;
          }
        }
      `}</style>
    </div>
  );
}