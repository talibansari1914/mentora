"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import { Mail } from "lucide-react";

// lucide-react intentionally does not include brand/logo icons (GitHub,
// Instagram, Twitter, etc. — trademark reasons), so these two are small
// local inline-SVG icons instead, sized/styled to match lucide's icons.
function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.17.69-3.84-1.35-3.84-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.17-3.05-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.81 1.17 3.05 0 4.37-2.67 5.34-5.21 5.62.41.36.77 1.06.77 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A11.03 11.03 0 0 0 23.02 11.52C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(ease * target));
          if (p < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function StatCell({ target, label, suffix = "+" }: { target: number; label: string; suffix?: string }) {
  const { count, ref } = useCounter(target);
  const display = target >= 1000 ? `${Math.floor(count / 1000)}K${suffix}` : `${count}${suffix}`;
  return (
    <div ref={ref} style={{ padding: "24px", transition: "background 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(120deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: "6px" }}>
        {display}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const FEATURES = [
  { icon: "🤖", title: "AI Learning Tools", wide: true, desc: "Upload a lecture, get structured notes instantly. Convert notes to audio for on-the-go revision. Ask any doubt and get step-by-step answers — 24/7.", tags: ["Video → Notes", "Notes → Audio", "AI Doubt Solver", "Concept Explainer"], badge: "Most Popular" },
  { icon: "📚", title: "Digital Library", wide: false, desc: "10,000+ books, e-books, handwritten notes, newspapers and research papers — organised by exam and topic.", tags: ["E-Books", "PYQs", "Research Papers"] },
  { icon: "📝", title: "Mock Tests & PYQs", wide: false, desc: "Exam-pattern mock tests with timer, detailed analysis and year-wise previous year questions for every subject.", tags: ["500+ Tests", "Year-wise PYQs", "Result Analysis"] },
  { icon: "📊", title: "Progress Analytics", wide: false, desc: "Weak topic detection, daily/weekly reports, and state & national rank comparison — know exactly where you stand.", tags: ["Daily Reports", "Weak Topics", "National Rank"] },
  { icon: "🗓️", title: "Study Planner", wide: false, desc: "Plan smarter with daily targets, Pomodoro timer, weekly goals, and an automated revision scheduler.", tags: ["Pomodoro", "Goals", "Revision Plan"] },
  { icon: "👨‍🏫", title: "Mentor Marketplace", wide: false, desc: "Book subject experts on-demand for live sessions. Hourly, topic-wise, or full subject — your choice.", tags: ["Instant Booking", "Video Call", "Chat Support"] },
];

const EXAMS = [
  { emoji: "🏛️", name: "UPSC", sub: "Civil Services Prelims & Mains", notes: "2,000+", tests: "150+", active: false },
  { emoji: "⚗️", name: "JEE", sub: "JEE Mains & Advanced", notes: "1,500+", tests: "200+", active: true },
  { emoji: "🔬", name: "NEET", sub: "Medical Entrance Preparation", notes: "1,800+", tests: "180+", active: false },
  { emoji: "📋", name: "SSC", sub: "CGL, CHSL, MTS & More", notes: "1,200+", tests: "100+", active: false },
  { emoji: "⚙️", name: "GATE", sub: "Engineering & University Exams", notes: "800+", tests: "120+", active: false },
];

const STEPS = [
  { n: "01", title: "Sign Up Free", desc: "Create your account in 30 seconds. No credit card. Pick your exam and you're in." },
  { n: "02", title: "Access Library", desc: "Browse thousands of books, notes and PYQs. Read online or download. Organised by topic and year." },
  { n: "03", title: "Practice & Rank", desc: "Take mock tests, get AI feedback, and watch your score and national rank improve every week." },
];

const PLANS = [
  { tier: "Free", price: "₹0", per: "/ month", desc: "Perfect to explore and get started.", features: ["50 Books Access", "5 Mock Tests / month", "Basic Study Planner", "Community Forum"], missing: ["AI Doubt Solver", "Video → Notes"], cta: "Get Started", popular: false },
  { tier: "Pro", price: "₹299", per: "/ month", desc: "Everything serious aspirants need.", features: ["Unlimited Books", "Unlimited Mock Tests", "AI Doubt Solver", "Video → Notes", "Notes → Audio", "Progress Analytics"], missing: [], cta: "Start Pro", popular: true },
  { tier: "Elite", price: "₹599", per: "/ month", desc: "For students who want an edge.", features: ["Everything in Pro", "2 Mentor Sessions / month", "Personal Study Plan", "Offline Downloads", "Priority Support", "National Rank Tracking"], missing: [], cta: "Go Elite", popular: false },
];

// Each link now carries its own href. Platform/Exams links point to /signup
// for now (same as the exam cards above) — once the login/signup "continue
// to where you were headed" flow is added, these will carry a ?next=... so
// a returning user lands directly on the right page instead of /dashboard.
const FOOTER_COLS = [
  {
    head: "Platform",
    links: [
      { label: "Digital Library", href: "/signup" },
      { label: "Mock Tests", href: "/signup" },
      { label: "PYQs", href: "/signup" },
      { label: "AI Tools", href: "/signup" },
      { label: "Mentors", href: "/signup" },
    ],
  },
  {
    head: "Exams",
    links: [
      { label: "UPSC", href: "/signup" },
      { label: "JEE", href: "/signup" },
      { label: "NEET", href: "/signup" },
      { label: "SSC", href: "/signup" },
      { label: "Banking", href: "/signup" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "mailto:talibansari623278@gmail.com" },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund Policy", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: GithubIcon, href: "https://github.com/talibansari1914", label: "GitHub" },
  { icon: InstagramIcon, href: "https://www.instagram.com/?hl=en", label: "Instagram" },
  { icon: Mail, href: "mailto:talibansari623278@gmail.com", label: "Email" },
];

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  gradText: { background: "linear-gradient(120deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const },
  inner: { maxWidth: "1200px", margin: "0 auto", padding: "0 48px" },
  badge: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const, color: "#F59E0B",
    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)",
    borderRadius: "100px", padding: "6px 16px", marginBottom: "18px",
  },
  dot: { width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", flexShrink: 0 as const },
  h2: { fontSize: "clamp(1.9rem,3.8vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: "14px", lineHeight: 1.15, color: "white" },
  p: { color: "#64748B", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75, fontSize: "1rem" },
  secHead: { textAlign: "center" as const, marginBottom: "64px" },
};

export default function Home() {
  const [liveCount, setLiveCount] = useState(2847);
  useEffect(() => {
    const t = setInterval(() => setLiveCount(2800 + Math.floor(Math.random() * 120)), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", overflowX: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "100px", paddingBottom: "80px", overflow: "hidden" }}>
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 85% 65% at 50% 0%,black 0%,transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 0%,black 0%,transparent 100%)",
        }} />
        {/* Glow */}
        <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse,rgba(245,158,11,0.13) 0%,transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div className="mentora-container" style={{ ...G.inner, position: "relative", zIndex: 2, width: "100%" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>

            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <div style={G.badge}>
                <span style={{ ...G.dot, animation: "pulse 2s infinite" }} />
                AI-Powered · Made for India
              </div>

              <h1 style={{ fontSize: "clamp(2.4rem,4.5vw,3.8rem)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.035em", margin: 0 }}>
                Learn Smarter<br />
                with <span style={G.gradText}>Mentora</span>
              </h1>

              <p style={{ color: "#94A3B8", fontSize: "1.05rem", lineHeight: 1.75, maxWidth: "420px", margin: 0 }}>
                Notes, Books, PYQs and Mock Tests — all in one place.
                Powered by AI. Built for UPSC, JEE, NEET, SSC and Engineering.
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem", color: "#080C14", background: G.grad, boxShadow: "0 4px 20px rgba(245,158,11,0.38)", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(245,158,11,0.5)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(245,158,11,0.38)"; }}>
                  Start Learning Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <Link href="#features" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "12px", fontWeight: 600, fontSize: "0.9rem", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  See Features
                </Link>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ display: "flex" }}>
                  {["AS", "RK", "PM", "VT"].map((a, i) => (
                    <div key={a} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2.5px solid #080C14", background: "#1A2640", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: "#CBD5E1", marginLeft: i === 0 ? 0 : -10 }}>
                      {a}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.8rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
                  <strong style={{ color: "#CBD5E1" }}>50,000+</strong> students preparing<br />with Mentora across India
                </p>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#111827", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
                  <StatCell target={50000} label="Active Students" />
                  <StatCell target={10000} label="Study Materials" />
                  <StatCell target={500} label="Mock Tests" />
                  <StatCell target={98} label="Success Rate" suffix="%" />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 20px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", flexShrink: 0, boxShadow: "0 0 8px #22C55E" }} />
                <span style={{ color: "#64748B", fontSize: "0.875rem" }}>Live right now —</span>
                <span style={{ fontWeight: 700, color: "#F59E0B", fontSize: "0.875rem", fontFamily: "monospace" }}>{liveCount.toLocaleString("en-IN")}</span>
                <span style={{ color: "#64748B", fontSize: "0.875rem" }}>students studying</span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[{ icon: "📚", text: "UPSC Notes downloaded" }, { icon: "✅", text: "Score: 87/100" }, { icon: "🤖", text: "Doubt solved in 3s" }].map(p => (
                  <div key={p.text} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "100px", padding: "8px 16px", fontSize: "0.78rem", color: "#CBD5E1" }}>
                    <span>{p.icon}</span>{p.text}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" style={{ padding: "96px 0", background: "#0D1220" }}>
        <div className="mentora-container" style={G.inner}>
          <div style={G.secHead}>
            <div style={G.badge}><span style={G.dot} />Everything You Need</div>
            <h2 style={G.h2}>One Platform. <span style={G.gradText}>All Your Needs.</span></h2>
            <p style={G.p}>From digital library to AI-powered doubt solving — Mentora covers every step of your preparation.</p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                gridColumn: f.wide ? "span 2" : "span 1",
                position: "relative", borderRadius: "20px", padding: "28px",
                background: f.wide ? "linear-gradient(145deg,#141E30,#111827)" : "#111827",
                border: f.wide ? "1px solid rgba(245,158,11,0.28)" : "1px solid rgba(255,255,255,0.07)",
                transition: "all 0.25s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(245,158,11,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = f.wide ? "rgba(245,158,11,0.28)" : "rgba(255,255,255,0.07)"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: G.grad, borderRadius: "20px 20px 0 0", opacity: f.wide ? 1 : 0 }} />
                {f.badge && <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", borderRadius: "100px", background: G.grad, color: "#080C14" }}>{f.badge}</span>}
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "18px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", marginBottom: "10px" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#64748B", lineHeight: 1.65, marginBottom: "18px" }}>{f.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {f.tags.map(t => (
                    <span key={t} style={{ fontSize: "0.65rem", fontWeight: 600, fontFamily: "monospace", color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "6px", padding: "3px 8px" }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EXAMS
      ══════════════════════════════════════════ */}
      <section id="exams" style={{ padding: "96px 0", background: "#080C14" }}>
        <div className="mentora-container" style={G.inner}>
          <div style={G.secHead}>
            <div style={G.badge}><span style={G.dot} />Choose Your Path</div>
            <h2 style={G.h2}>Prepared for <span style={G.gradText}>Every Exam</span></h2>
            <p style={G.p}>Dedicated libraries, mock tests and study materials for every major competitive exam in India.</p>
          </div>
          <div className="exams-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "14px" }}>
            {EXAMS.map(e => (
              <div key={e.name} style={{ borderRadius: "18px", padding: "24px 16px", textAlign: "center", border: e.active ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.07)", background: e.active ? "linear-gradient(160deg,rgba(245,158,11,0.1),transparent)" : "#111827", transition: "all 0.25s", cursor: "pointer" }}
                onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.transform = "translateY(-5px)"; (e2.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.4)"; (e2.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e2.currentTarget as HTMLElement).style.borderColor = e.active ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"; (e2.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <span style={{ fontSize: "2.2rem", display: "block", marginBottom: "12px" }}>{e.emoji}</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "5px" }}>{e.name}</h3>
                <p style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "14px", lineHeight: 1.4 }}>{e.sub}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
                  {[`${e.notes} Notes`, `${e.tests} Tests`].map(s => (
                    <span key={s} style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#64748B", background: "#0D1220", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "3px 6px" }}>{s}</span>
                  ))}
                </div>
                <Link href="/signup" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#F59E0B", textDecoration: "none" }}>Explore →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how" style={{ padding: "96px 0", background: "#0D1220" }}>
        <div className="mentora-container" style={{ ...G.inner, maxWidth: "920px" }}>
          <div style={G.secHead}>
            <div style={G.badge}><span style={G.dot} />Simple & Powerful</div>
            <h2 style={G.h2}>Up and running <span style={G.gradText}>in minutes</span></h2>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", alignItems: "center" }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: "contents" }}>
                <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "36px 24px", textAlign: "center", transition: "all 0.25s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, fontFamily: "monospace", color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "5px 14px", marginBottom: "20px" }}>Step {s.n}</span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>{s.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="steps-arrow" style={{ color: "#334155", fontSize: "1.4rem", padding: "0 16px", textAlign: "center" }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "96px 0", background: "#080C14" }}>
        <div className="mentora-container" style={{ ...G.inner, maxWidth: "980px" }}>
          <div style={G.secHead}>
            <div style={G.badge}><span style={G.dot} />Simple Pricing</div>
            <h2 style={G.h2}>Invest in your <span style={G.gradText}>future</span></h2>
            <p style={G.p}>Start free, upgrade when you need more. Cancel anytime.</p>
          </div>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", alignItems: "center" }}>
            {PLANS.map(p => (
              <div key={p.tier} className="pricing-card" style={{ position: "relative", borderRadius: "22px", padding: "32px 28px", display: "flex", flexDirection: "column", border: p.popular ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.07)", background: p.popular ? "linear-gradient(160deg,rgba(245,158,11,0.07),#111827)" : "#111827", boxShadow: p.popular ? "0 0 48px rgba(245,158,11,0.1)" : "none", transform: p.popular ? "scale(1.04)" : "scale(1)", transition: "all 0.25s" }}
                onMouseEnter={e => { if (!p.popular) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { if (!p.popular) (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 18px", borderRadius: "100px", background: G.grad, color: "#080C14", whiteSpace: "nowrap" }}>Most Popular</div>
                )}
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748B", marginBottom: "8px" }}>{p.tier}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{p.price}</span>
                  <span style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "4px" }}>{p.per}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "24px" }}>{p.desc}</p>
                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "22px" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "#CBD5E1" }}>
                      <span style={{ color: "#F59E0B", fontSize: "0.7rem", flexShrink: 0 }}>✦</span>{f}
                    </li>
                  ))}
                  {p.missing.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "#334155", opacity: 0.5 }}>
                      <span style={{ fontSize: "0.7rem", flexShrink: 0 }}>—</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{ display: "block", textAlign: "center", fontSize: "0.9rem", fontWeight: 700, padding: "13px", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s", ...(p.popular ? { background: G.grad, color: "#080C14", boxShadow: "0 4px 18px rgba(245,158,11,0.32)" } : { border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1" }) }}
                  onMouseEnter={e => { if (p.popular) { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(245,158,11,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; } else { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; (e.currentTarget as HTMLElement).style.color = "white"; } }}
                  onMouseLeave={e => { if (p.popular) { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(245,158,11,0.32)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; } else { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "#CBD5E1"; } }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ position: "relative", borderRadius: "28px", padding: "80px 48px", textAlign: "center", overflow: "hidden", background: "linear-gradient(135deg,rgba(245,158,11,0.09),rgba(249,115,22,0.04))", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "400px", height: "200px", background: "rgba(245,158,11,0.1)", filter: "blur(60px)", pointerEvents: "none" }} />
            <h2 style={{ position: "relative", fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "16px" }}>
              Ready to <span style={G.gradText}>transform</span> your preparation?
            </h2>
            <p style={{ position: "relative", color: "#64748B", marginBottom: "36px", fontSize: "1rem" }}>
              Join 50,000+ students who are already learning smarter with Mentora.
            </p>
            <div style={{ position: "relative", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" style={{ padding: "14px 32px", borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem", color: "#080C14", background: G.grad, boxShadow: "0 4px 20px rgba(245,158,11,0.32)", textDecoration: "none" }}>
                Create Free Account
              </Link>
              <Link href="#features" style={{ padding: "14px 32px", borderRadius: "12px", fontWeight: 600, fontSize: "0.9rem", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none" }}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0D1220", paddingTop: "64px", paddingBottom: "32px" }}>
        <div className="mentora-container" style={G.inner}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(4,1fr)", gap: "48px", marginBottom: "48px" }}>
            <div>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "16px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>⚡</div>
                <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "white" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
              </Link>
              <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.7, marginBottom: "20px", maxWidth: "220px" }}>
                India's most intelligent learning platform for competitive exam preparation.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#111827", border: "1px solid rgba(255,255,255,0.07)", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "color 0.2s, border-color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F59E0B"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#64748B"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.head}>
                <h4 style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "white", marginBottom: "18px" }}>{col.head}</h4>
                {col.links.map(l => (
                  <Link key={l.label} href={l.href} style={{ display: "block", fontSize: "0.83rem", color: "#475569", marginBottom: "10px", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = "white"}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = "#475569"}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "0.78rem", color: "#334155" }}>© 2026 Mentora. All rights reserved. Made with ❤️ in India.</p>
            <div style={{ display: "flex", gap: "20px" }}>
              <Link href="/privacy" style={{ fontSize: "0.78rem", color: "#334155", textDecoration: "none" }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: "0.78rem", color: "#334155", textDecoration: "none" }}>Terms</Link>
              <a href="mailto:talibansari623278@gmail.com" style={{ fontSize: "0.78rem", color: "#334155", textDecoration: "none" }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 968px) {
          .mentora-container { padding: 0 24px; }

          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
          .exams-grid { grid-template-columns: repeat(3,1fr) !important; }

          .steps-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .steps-arrow { transform: rotate(90deg); padding: 8px 0 !important; }

          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
          .pricing-card { transform: scale(1) !important; }

          .footer-grid { grid-template-columns: repeat(2,1fr) !important; gap: 32px !important; }
        }

        @media (max-width: 600px) {
          .mentora-container { padding: 0 18px; }

          .features-grid { grid-template-columns: 1fr !important; }
          .exams-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}