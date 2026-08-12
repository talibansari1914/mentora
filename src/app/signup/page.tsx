"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import type { CSSPropertiesWithVars } from "@/types/css";
import { Zap, Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@/components/auth/Turnstile";
import { getErrorMessage } from "@/lib/errors";

const EXAMS = ["UPSC","JEE","NEET","SSC","Banking","Engineering"];
const EXAM_ICONS: Record<string,string> = { UPSC:"🏛️", JEE:"⚗️", NEET:"🔬", SSC:"📋", Banking:"🏦", Engineering:"⚙️" };

const PERKS = [
  { title: "Free forever plan", sub: "50 books + 5 mock tests every month" },
  { title: "AI Doubt Solver", sub: "Get answers to any question instantly" },
  { title: "Progress tracking", sub: "See your rank improve week by week" },
  { title: "No credit card needed", sub: "Start free, upgrade when ready" },
];

function PwStrength({ pw }: { pw: string }) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { pct:"0%", color:"transparent", text:"" },
    { pct:"25%", color:"#EF4444", text:"Weak" },
    { pct:"50%", color:"#b45309", text:"Fair" },
    { pct:"75%", color:"#1e40af", text:"Good" },
    { pct:"100%", color:"#166534", text:"Strong ✓" },
  ];
  const l = levels[Math.min(score, 4)];
  if (!pw) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"8px" }}>
      <div style={{ flex:1, height:"3px", background:"#2d3748", borderRadius:"2px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:l.pct, background:l.color, borderRadius:"2px", transition:"all 0.3s" }} />
      </div>
      <span style={{ fontSize:"0.7rem", color:l.color, fontFamily:"monospace", whiteSpace:"nowrap" }}>{l.text}</span>
    </div>
  );
}

// Re-plays a staggered "cascade" reveal every time `step` changes: each
// direct child fades in + un-blurs + slides up, one after another, instead
// of the whole step just popping in at once. This is the same technique
// from the reference video (blur/opacity/translate + a per-child delay via
// --i) — just using our own colors, applied to the app's own step content.
// `key={step}` at the call site forces a fresh mount on every step change
// (forward AND back), which is what re-triggers the animation each time.
function StepReveal({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`step-cascade${active ? " active" : ""}`} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  // Basic RFC-5322-ish check — good enough to catch "asdf" or "a@b" typed
  // into the field, not meant to be a fully spec-compliant validator.
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const goStep2 = () => {
    setError("");

    if (!fname || !lname) {
      setError("Please enter your first and last name.");
      doShake();
      return;
    }
    if (!email) {
      setError("Please enter your email address.");
      doShake();
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      doShake();
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      doShake();
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    if (!selectedExam) { doShake(); return; }
    setLoading(true);
    setError("");

    // Uses authService.signUp() (same as the rest of the app) instead of
    // calling supabase.auth.signUp() directly, so the exam value goes
    // through the same normalizeExam() step every other signup path uses.
    try {
      await authService.signUp({
        fullName: `${fname} ${lname}`,
        firstName: fname,
        email,
        password,
        exam: selectedExam,
        captchaToken,
      });
      setStep(3);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not create your account."));
      setStep(1);
    } finally {
      setLoading(false);
      // Turnstile tokens are single-use - clear it so a retry after a
      // failed signup waits for the widget to issue a fresh token.
      setCaptchaToken(undefined);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Was pointing straight at /dashboard, which skips the OAuth code
        // exchange entirely — /auth/callback is what actually turns the
        // ?code=... Supabase sends back into a real logged-in session.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"12px 14px", background:"#161f31",
    border:"1px solid #2d3748", borderRadius:"12px",
    color:"white", fontSize:"0.9rem", outline:"none",
    boxSizing:"border-box", transition:"border 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5a623", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Main Split Card Container */}
      <div className="signup-container" style={{ width: "100%", maxWidth: "960px", minHeight: "580px", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#0b0f17", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>

        {/* LEFT PANEL: Amber/Yellow Block with Mentora Text, Quote, Perks & Activity Feed */}
        <div style={{ background: "#f59e0b", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "36px 32px", color: "#111827", boxSizing: "border-box" }}>
          
          <div>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} style={{ color: "#f59e0b" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "#111827" }}>Mentora</span>
            </div>

            {/* Quote */}
            <div style={{ borderLeft: "3px solid #111827", paddingLeft: "12px", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.9rem", fontStyle: "italic", color: "#111827", lineHeight: 1.4, marginBottom: "4px" }}>
                &ldquo;The secret of getting ahead is getting started.&rdquo;
              </p>
              <span style={{ fontSize: "0.75rem", color: "rgba(17, 24, 39, 0.7)", fontWeight: 600 }}>— Mark Twain</span>
            </div>

            {/* Perks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {PERKS.map(p => (
                <div key={p.title} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "#111827", fontSize: "0.65rem", marginTop: "3px", flexShrink: 0 }}>✦</span>
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827", marginBottom: "1px" }}>{p.title}</p>
                    <p style={{ fontSize: "0.72rem", color: "rgba(17, 24, 39, 0.8)", fontWeight: 500 }}>{p.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "20px" }}>
            {[
              { icon: "🆕", name: "Vikram J. just joined from Bhopal", time: "Just now" },
              { icon: "📚", name: "Sneha R. downloaded UPSC notes", time: "3 min ago" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(17, 24, 39, 0.1)", backdropFilter: "blur(4px)", border: "1px solid rgba(17, 24, 39, 0.15)", borderRadius: "10px", padding: "8px 12px" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{a.icon}</span>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#111827", marginBottom: "1px" }}>{a.name}</p>
                  <p style={{ fontSize: "0.65rem", color: "rgba(17, 24, 39, 0.7)", fontFamily: "monospace" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT PANEL: Signup Form Steps (Dark Mode) */}
        <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#0b0f17", boxSizing: "border-box", animation: shake ? "shake 0.4s ease" : "none" }}>

          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "6px", color: "white" }}>Create your account</h1>
            <p style={{ color: "#a0aec0", fontSize: "0.82rem" }}>Free forever. No credit card required.</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
            {[1,2,3].map((n, i) => (
              <div key={n} style={{ display: "contents" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
                  background: step > n ? "#22C55E" : step === n ? "#f59e0b" : "#161f31",
                  border: step > n ? "none" : step === n ? "none" : "1.5px solid #2d3748",
                  color: step > n ? "white" : step === n ? "#0b0f17" : "#a0aec0",
                }}>
                  {step > n ? "✓" : n}
                </div>
                {i < 2 && <div style={{ flex: 1, height: "1.5px", background: step > n ? "#22C55E" : "#2d3748", transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            {["Your Info","Exam Goal","Done"].map((l, i) => (
              <span key={l} style={{ fontSize: "0.68rem", fontWeight: step === i+1 ? 600 : 400, color: step === i+1 ? "#f59e0b" : "#a0aec0", flex: 1, textAlign: i===0 ? "left" : i===2 ? "right" : "center" }}>{l}</span>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "10px 12px", marginBottom: "14px", fontSize: "0.8rem", color: "#f87171" }}>
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <StepReveal key={step}>
                <button type="button" onClick={handleGoogle} className="step-field" style={{ "--i": 0, width: "100%", padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", color: "#cbd5e1", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", marginBottom: "16px" } as CSSPropertiesWithVars}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>

                <div className="step-field" style={{ "--i": 1, position: "relative", textAlign: "center", margin: "14px 0" } as CSSPropertiesWithVars}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#2d3748" }} />
                  <span style={{ position: "relative", background: "#0b0f17", padding: "0 10px", fontSize: "0.7rem", color: "#a0aec0" }}>or with email</span>
                </div>

                <div className="step-field" style={{ "--i": 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" } as CSSPropertiesWithVars}>
                  <input value={fname} onChange={e => setFname(e.target.value)} placeholder="First name" style={inputStyle} />
                  <input value={lname} onChange={e => setLname(e.target.value)} placeholder="Last name" style={inputStyle} />
                </div>

                <div className="step-field" style={{ "--i": 3, marginBottom: "12px" } as CSSPropertiesWithVars}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={inputStyle} />
                </div>

                <div className="step-field" style={{ "--i": 4, marginBottom: "18px", position: "relative" } as CSSPropertiesWithVars}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 chars)" style={{ ...inputStyle, paddingRight: "42px" }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a0aec0", display: "flex", alignItems: "center" }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <PwStrength pw={password} />
                </div>

                <button type="button" onClick={goStep2} className="step-field" style={{ "--i": 5, width: "100%", padding: "12px", background: "#f1f5f9", border: "none", borderRadius: "20px", color: "#1e293b", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", boxShadow: "5px 5px 10px rgba(0,0,0,0.2), -5px -5px 10px rgba(255,255,255,0.1)" } as CSSPropertiesWithVars}>
                  CONTINUE →
                </button>
              </StepReveal>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <StepReveal key={step}>
                <p className="step-field" style={{ "--i": 0, fontSize: "0.85rem", fontWeight: 600, color: "white", marginBottom: "12px" } as CSSPropertiesWithVars}>Which exam are you preparing for?</p>
                <div className="exam-select-grid step-field" style={{ "--i": 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "20px" } as CSSPropertiesWithVars}>
                  {EXAMS.map(ex => (
                    <div key={ex} onClick={() => setSelectedExam(ex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "12px 6px", background: selectedExam===ex ? "rgba(245,158,11,0.15)" : "#161f31", border: selectedExam===ex ? "1.5px solid #f59e0b" : "1.5px solid #2d3748", borderRadius: "12px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: selectedExam===ex ? "#f59e0b" : "#a0aec0", transition: "all 0.2s" }}>
                      <span style={{ fontSize: "1.2rem" }}>{EXAM_ICONS[ex]}</span>
                      {ex}
                    </div>
                  ))}
                </div>

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <div className="step-field" style={{ "--i": 2, marginBottom: "12px" } as CSSPropertiesWithVars}>
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken(undefined)}
                    />
                  </div>
                )}

                <div className="step-field" style={{ "--i": 3, display: "flex", gap: "10px" } as CSSPropertiesWithVars}>
                  <button type="button" onClick={() => setStep(1)} style={{ padding: "12px 16px", background: "#161f31", border: "1px solid #2d3748", borderRadius: "12px", color: "#a0aec0", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>← Back</button>
                  <button type="button" onClick={handleSignup} disabled={!selectedExam || loading} style={{ flex: 1, padding: "12px", background: selectedExam ? "#f1f5f9" : "#161f31", border: "none", borderRadius: "20px", color: selectedExam ? "#1e293b" : "#a0aec0", fontSize: "0.85rem", fontWeight: 700, cursor: selectedExam ? "pointer" : "not-allowed", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                  </button>
                </div>
              </StepReveal>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <StepReveal key={step}>
                <div className="step-field" style={{ "--i": 0, fontSize: "3rem", marginBottom: "14px" } as CSSPropertiesWithVars}>🎉</div>
                <h2 className="step-field" style={{ "--i": 1, fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "8px" } as CSSPropertiesWithVars}>You&apos;re in!</h2>
                <p className="step-field" style={{ "--i": 2, fontSize: "0.85rem", color: "#a0aec0", lineHeight: 1.5, marginBottom: "6px" } as CSSPropertiesWithVars}>
                  Account created successfully!
                </p>
                <p className="step-field" style={{ "--i": 3, fontSize: "0.78rem", color: "#718096", lineHeight: 1.5, marginBottom: "20px" } as CSSPropertiesWithVars}>
                  📧 Check your email to verify your account, then log in.
                </p>
                <Link href="/login" className="step-field" style={{ "--i": 4, display: "block", textAlign: "center", padding: "12px", background: "#f1f5f9", borderRadius: "20px", color: "#1e293b", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" } as CSSPropertiesWithVars}>
                  GO TO LOGIN →
                </Link>
              </StepReveal>
            </div>
          )}

          {step < 3 && (
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.82rem", color: "#a0aec0" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>Log in →</Link>
            </p>
          )}
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "0.72rem", color: "#718096", lineHeight: 1.4 }}>
            By signing up, you agree to our{" "}
            <Link href="/terms" style={{ color: "#a0aec0", textDecoration: "none" }}>Terms</Link> &amp;{" "}
            <Link href="/privacy" style={{ color: "#a0aec0", textDecoration: "none" }}>Privacy</Link>.
          </p>
        </div>

      </div>

      <style jsx>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}

        /* Staggered cascade reveal for step transitions — each .step-field
           starts blurred/faded/lowered, then settles in one after another
           per its --i index once .step-cascade gets the "active" class. */
        .step-field {
          --i: 0;
          transform: translateY(14px);
          opacity: 0;
          filter: blur(6px);
          transition: transform 0.5s ease, opacity 0.5s ease, filter 0.5s ease;
          transition-delay: calc(0.07s * var(--i));
        }
        :global(.step-cascade.active) .step-field {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0);
        }

        @media(max-width: 768px) {
          .signup-container {
            grid-template-columns: 1fr !important;
          }
          .signup-container > div:first-child {
            order: 2;
          }
          .signup-container > div:last-child {
            order: 1;
          }
        }
        @media(max-width: 380px){
          .exam-select-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}