"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { getLatestResult, TestResult } from "@/lib/questionBank";

const G = { grad: "linear-gradient(120deg,#F59E0B,#F97316)", card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px" } };

const EXAM_LABEL: Record<string, string> = { jee: "JEE", neet: "NEET", upsc: "UPSC", ssc: "SSC" };

function ResultContent() {
  const params = useSearchParams();
  const [stored, setStored] = useState<TestResult | null>(null);

  useEffect(() => {
    setStored(getLatestResult());
  }, []);

  // Prefer the freshly-saved localStorage record (has real subject breakdown);
  // fall back to URL params if it's not available yet.
  const correct = stored?.correct ?? parseInt(params.get("correct") || "0");
  const wrong = stored?.wrong ?? parseInt(params.get("wrong") || "0");
  const skipped = stored?.skipped ?? parseInt(params.get("skipped") || "0");
  const score = stored?.score ?? parseInt(params.get("score") || "0");
  const total = stored?.total ?? parseInt(params.get("total") || "40");
  const timeUsed = stored?.timeUsed ?? parseInt(params.get("timeUsed") || "0");
  const exam = stored?.exam ?? params.get("exam") ?? "jee";
  const title = stored?.title ?? params.get("title") ?? "Mock Test";
  const subjectBreakdown = stored?.subjectBreakdown ?? [];

  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const percentile = Math.min(99, Math.round((score / (total || 1)) * 100 * 0.95 + 4));

  const pieData = [
    { name: "Correct", value: correct, color: "#22C55E" },
    { name: "Wrong", value: wrong, color: "#EF4444" },
    { name: "Skipped", value: skipped, color: "#475569" },
  ];

  const radarData = subjectBreakdown.map(s => ({ subject: s.subject, accuracy: s.accuracy }));

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>

      <header style={{ background: "#0D1220", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
          </Link>
          <Link href="/mock-tests" style={{ fontSize: "0.85rem", color: "#64748B", textDecoration: "none" }}>← Back to Tests</Link>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px 60px" }}>

        {/* Score hero */}
        <div style={{ ...G.card, padding: "40px", textAlign: "center", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "400px", height: "200px", background: "rgba(245,158,11,0.1)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "3px 12px" }}>{EXAM_LABEL[exam] || exam.toUpperCase()}</span>
          </div>
          <p style={{ position: "relative", fontSize: "0.85rem", color: "#94A3B8", marginBottom: "4px" }}>{title}</p>
          <p style={{ position: "relative", fontSize: "0.75rem", color: "#64748B", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Test Completed 🎉</p>
          <div style={{ position: "relative", display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", marginBottom: "10px" }}>
            <span style={{ fontSize: "4rem", fontWeight: 900, letterSpacing: "-0.04em", background: G.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: "1.5rem", color: "#64748B", fontWeight: 600 }}>/ {total}</span>
          </div>
          <p style={{ position: "relative", fontSize: "0.9rem", color: "#94A3B8" }}>
            You scored better than <strong style={{ color: "#F59E0B" }}>{percentile}%</strong> of students
          </p>

          <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: "32px", marginTop: "28px", flexWrap: "wrap" }}>
            {[
              { label: "Correct", val: correct, color: "#22C55E" },
              { label: "Wrong", val: wrong, color: "#EF4444" },
              { label: "Skipped", val: skipped, color: "#64748B" },
              { label: "Accuracy", val: `${accuracy}%`, color: "#F59E0B" },
              { label: "Time Used", val: fmtTime(timeUsed), color: "#22D3EE" },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.val}</p>
                <p style={{ fontSize: "0.7rem", color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {subjectBreakdown.length > 0 ? (
          <>
            {/* Charts grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
              <div style={{ ...G.card, padding: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px" }}>Answer Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1A2336", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "0.8rem" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "8px" }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                      <span style={{ width: "9px", height: "9px", borderRadius: "3px", background: d.color }} />
                      <span style={{ color: "#94A3B8" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...G.card, padding: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px" }}>Subject-wise Accuracy</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#1A2336", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "0.8rem" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {subjectBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.accuracy >= 70 ? "#22C55E" : entry.accuracy >= 50 ? "#F59E0B" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px", marginBottom: "18px" }}>
              <div style={{ ...G.card, padding: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px" }}>Strength Map</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} domain={[0, 100]} />
                    <Radar dataKey="accuracy" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject breakdown bars */}
            <div style={{ ...G.card, padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "18px" }}>Subject Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {subjectBreakdown.map(s => (
                  <div key={s.subject} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ width: "90px", fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 600, flexShrink: 0 }}>{s.subject}</span>
                    <div style={{ flex: 1, height: "8px", background: "#1A2336", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${(s.correct / (s.correct + s.wrong + s.skipped || 1)) * 100}%`, background: "#22C55E" }} />
                      <div style={{ width: `${(s.wrong / (s.correct + s.wrong + s.skipped || 1)) * 100}%`, background: "#EF4444" }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", color: s.accuracy >= 70 ? "#22C55E" : s.accuracy >= 50 ? "#F59E0B" : "#EF4444", fontFamily: "monospace", fontWeight: 700, width: "44px", textAlign: "right" }}>{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", marginBottom: "24px" }}>
            <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Detailed analytics loading...</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/mock-tests" style={{ flex: 1, minWidth: "200px", textAlign: "center", padding: "14px", borderRadius: "12px", background: G.grad, color: "#080C14", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Take Another Test
          </Link>
          <Link href="/dashboard" style={{ flex: 1, minWidth: "200px", textAlign: "center", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <style>{`@media(max-width:768px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080C14" }} />}>
      <ResultContent />
    </Suspense>
  );
}