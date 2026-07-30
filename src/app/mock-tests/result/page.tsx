"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line
} from "recharts";

// ── Theme / Style Constants (Matching the Image) ──
const theme = {
  bg: "#0B0E14", // Deep background
  cardBg: "#131620", // Card background
  border: "1px solid rgba(255,255,255,0.04)",
  textMain: "#FFFFFF",
  textMuted: "#8F95B2",
  green: "#10B981",
  red: "#F43F5E",
  accentPurple: "#6366F1",
  accentBlue: "#06B6D4",
  accentPink: "#EC4899",
  accentOrange: "#F59E0B",
  accentYellow: "#EAB308",
  barMuted: "#1E2235"
};

const G = {
  card: { 
    background: theme.cardBg, 
    border: theme.border, 
    borderRadius: "16px", 
    padding: "24px" 
  },
};

// ── Types ──────────────────────────────────────────────────────────────────
type SubjectBreakdown = {
  subject: string;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  attempted: number;
};

type StoredResult = {
  title: string;
  exam: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeUsed: number;
  subjectBreakdown: SubjectBreakdown[];
};

// ── Data Fetching ──
function getLatestFromStorage(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mentora_test_results");
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return null;
  }
}

// ── Custom Tooltip Components ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(19, 22, 32, 0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.8rem", marginBottom: "8px" }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color }} />
            <span style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{entry.value}</span>
            <span style={{ color: theme.textMuted, fontSize: "0.8rem" }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Content ───────────────────────────────────────────────────────────
function ResultContent() {
  const params = useSearchParams();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(getLatestFromStorage());
    setLoaded(true);
  }, []);

  const correct  = stored?.correct  ?? parseInt(params.get("correct")  || "0");
  const wrong    = stored?.wrong    ?? parseInt(params.get("wrong")    || "0");
  const skipped  = stored?.skipped  ?? parseInt(params.get("skipped")  || "0");
  const score    = stored?.score    ?? parseInt(params.get("score")    || "0");
  const total    = stored?.total    ?? parseInt(params.get("total")    || "40");
  const timeUsed = stored?.timeUsed ?? parseInt(params.get("timeUsed") || "0");
  
  const totalQuestions = correct + wrong + skipped;
  const accuracy   = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const percentile = Math.min(99, Math.round((score / (total || 1)) * 100 * 0.95 + 4));
  const pacePerQ   = totalQuestions > 0 ? Math.round(timeUsed / totalQuestions) : 0;

  const rawBreakdown: SubjectBreakdown[] = stored?.subjectBreakdown ?? [];
  const breakdown = rawBreakdown.map(s => ({
    ...s,
    attempted: s.correct + s.wrong,
    score: (s.correct * 4) - (s.wrong * 1) // Mocking standard scoring for the chart
  }));

  const pieData = [
    { name: "Correct", value: correct, color: theme.accentPurple },
    { name: "Wrong",   value: wrong,   color: theme.accentPink },
    { name: "Skipped", value: skipped, color: theme.accentYellow },
  ];

  // Find highest score index to highlight the bar like in the image
  const highestScoreIdx = breakdown.length > 0 
    ? breakdown.reduce((maxIdx, curr, idx, arr) => curr.score > arr[maxIdx].score ? idx : maxIdx, 0)
    : -1;

  if (!loaded) return <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMain, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Dashboard Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px" }}>
        
        {/* Title Row */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 500 }}>Test Analysis</h1>
        </div>

        {/* ── Main Bento Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          {/* TOP LEFT: 2x2 KPI Grid (Spans 5 cols) */}
          <div style={{ gridColumn: "span 5", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.9rem" }}>Total Score</span>
                <span style={{ color: theme.textMuted }}>📄</span>
              </div>
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 500, margin: "16px 0 8px" }}>{score} <span style={{ fontSize: "1.2rem", color: theme.textMuted }}>/ {total}</span></h2>
                <p style={{ color: theme.green, fontSize: "0.8rem", fontWeight: 500 }}>↗ +12% <span style={{ color: theme.textMuted }}>to previous test</span></p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.9rem" }}>Percentile</span>
                <span style={{ color: theme.textMuted }}>🏆</span>
              </div>
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 500, margin: "16px 0 8px" }}>{percentile}%</h2>
                <p style={{ color: theme.green, fontSize: "0.8rem", fontWeight: 500 }}>↗ Top {100 - percentile}% <span style={{ color: theme.textMuted }}>of students</span></p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.9rem" }}>Accuracy</span>
                <span style={{ color: theme.textMuted }}>🎯</span>
              </div>
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 500, margin: "16px 0 8px" }}>{accuracy}%</h2>
                <p style={{ color: accuracy >= 70 ? theme.green : theme.red, fontSize: "0.8rem", fontWeight: 500 }}>
                  {accuracy >= 70 ? "↗" : "↘"} {accuracy}% <span style={{ color: theme.textMuted }}>overall accuracy</span>
                </p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.9rem" }}>Avg Time/Q</span>
                <span style={{ color: theme.textMuted }}>⏱️</span>
              </div>
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: 500, margin: "16px 0 8px" }}>{pacePerQ}s</h2>
                <p style={{ color: theme.textMuted, fontSize: "0.8rem" }}>Based on total time spent</p>
              </div>
            </div>

          </div>

          {/* TOP RIGHT: Bar Chart (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <span style={{ color: "white", fontSize: "0.95rem" }}>Subject Performance</span>
              <span style={{ border: theme.border, padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}>→</span>
            </div>
            <div style={{ flex: 1, minHeight: "220px" }}>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdown} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                    <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={28}>
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === highestScoreIdx ? theme.accentPurple : theme.barMuted} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No subject data</div>
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: Line Chart (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <span style={{ color: "white", fontSize: "0.95rem" }}>Attempt Distribution</span>
              <span style={{ border: theme.border, padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}>→</span>
            </div>
            
            {/* Custom Legend for Line Chart */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.accentPurple }}>●</span> Correct</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.accentPink }}>●</span> Wrong</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.accentYellow }}>●</span> Skipped</div>
            </div>

            <div style={{ flex: 1, minHeight: "220px" }}>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" name="Correct" dataKey="correct" stroke={theme.accentPurple} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: theme.bg, stroke: theme.accentPurple, strokeWidth: 2 }} />
                    <Line type="monotone" name="Wrong" dataKey="wrong" stroke={theme.accentPink} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: theme.bg, stroke: theme.accentPink, strokeWidth: 2 }} />
                    <Line type="monotone" name="Skipped" dataKey="skipped" stroke={theme.accentYellow} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: theme.bg, stroke: theme.accentYellow, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No data</div>
              )}
            </div>
          </div>

          {/* BOTTOM RIGHT: Donut Chart (Spans 5 cols) */}
          <div style={{ ...G.card, gridColumn: "span 5", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "white", fontSize: "0.95rem" }}>Accuracy Breakdown</span>
              <span style={{ border: theme.border, padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}>→</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", flex: 1, position: "relative" }}>
              
              {/* Left Legend (Percentages) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                <div>
                  <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{accuracy}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}>Accuracy Rate</p>
                </div>
                <div>
                  <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{totalQuestions > 0 ? Math.round(((wrong + skipped)/totalQuestions)*100) : 0}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}>Error/Skip Rate</p>
                </div>
              </div>

              {/* Chart */}
              <div style={{ width: "200px", height: "200px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ color: "white", fontSize: "1.4rem", fontWeight: 600 }}>{totalQuestions}</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}>Total Q's</p>
                </div>
              </div>

              {/* Right Legend (Absolute values) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, alignItems: "flex-end", textAlign: "right" }}>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}><span style={{ color: theme.accentPurple }}>●</span> Correct</p>
                  <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{correct}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}><span style={{ color: theme.accentPink }}>●</span> Wrong</p>
                  <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{wrong}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}><span style={{ color: theme.accentYellow }}>●</span> Skipped</p>
                  <p style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{skipped}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* ── Responsive CSS Grid ── */}
      <style>{`
        @media(max-width: 1200px) {
          div[style*="grid-template-columns: repeat(12, 1fr)"] > div {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Result Engine...</div>}>
      <ResultContent />
    </Suspense>
  );
}