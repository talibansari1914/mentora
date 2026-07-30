"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line
} from "recharts";
import { getLatestResult, TestResult } from "@/lib/questionBank";

// ── Theme / Style Constants (Matching the Bento reference style) ──
const theme = {
  bg: "#0B0E14",
  cardBg: "#131620",
  border: "1px solid rgba(255,255,255,0.04)",
  textMain: "#FFFFFF",
  textMuted: "#8F95B2",
  green: "#10B981",
  red: "#F43F5E",
  accentPurple: "#6366F1",
  accentPink: "#EC4899",
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

const EXAM_LABEL: Record<string, string> = { jee: "JEE", neet: "NEET", ups: "UPSC", ssc: "SSC" };

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(19, 22, 32, 0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 14px", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.75rem", marginBottom: "6px" }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: entry.color || entry.fill }} />
            <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{entry.value}</span>
            <span style={{ color: theme.textMuted, fontSize: "0.75rem" }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ResultContent() {
  const params = useSearchParams();
  const [stored, setStored] = useState<TestResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(getLatestResult());
    setLoaded(true);
  }, []);

  const correct = stored?.correct ?? parseInt(params.get("correct") || "0");
  const wrong = stored?.wrong ?? parseInt(params.get("wrong") || "0");
  const skipped = stored?.skipped ?? parseInt(params.get("skipped") || "0");
  const score = stored?.score ?? parseInt(params.get("score") || "0");
  const total = stored?.total ?? parseInt(params.get("total") || "40");
  const timeUsed = stored?.timeUsed ?? parseInt(params.get("timeUsed") || "0");
  const exam = stored?.exam ?? params.get("exam") ?? "jee";
  const subjectBreakdown = stored?.subjectBreakdown ?? [];

  const totalQuestions = correct + wrong + skipped;
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const percentile = Math.min(99, Math.round((score / (total || 1)) * 100 * 0.95 + 4));
  const pacePerQ = totalQuestions > 0 ? Math.round(timeUsed / totalQuestions) : 0;

  const pieData = [
    { name: "Correct", value: correct, color: theme.green },
    { name: "Wrong", value: wrong, color: theme.red },
    { name: "Skipped", value: skipped, color: theme.textMuted },
  ];

  const chartBreakdown = subjectBreakdown.map(s => ({
    ...s,
    attempted: s.correct + s.wrong,
    displayScore: (s.correct * 4) - (s.wrong * 1) 
  }));

  const highestScoreIdx = chartBreakdown.length > 0 
    ? chartBreakdown.reduce((maxIdx, curr, idx, arr) => curr.displayScore > arr[maxIdx].displayScore ? idx : maxIdx, 0)
    : -1;

  if (!loaded) {
    return <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Analysis...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMain, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Dashboard Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        
        {/* Title & Navigation Row with PYQs & QuestionBank Links Added */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 500 }}>Test Analysis</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/mock-tests" style={{ background: "transparent", border: theme.border, color: "white", padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              ← Tests
            </Link>
            <Link href="/pyqs" style={{ background: "transparent", border: theme.border, color: "white", padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              PYQs
            </Link>
            <Link href="/question-bank" style={{ background: "transparent", border: theme.border, color: "white", padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              QuestionBank
            </Link>
            <Link href="/dashboard" style={{ background: theme.accentPurple, border: "none", color: "white", padding: "8px 18px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center" }}>
              Dashboard
            </Link>
          </div>
        </div>

        {/* ── Bento Grid Container ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          {/* TOP LEFT: 2x2 KPI Grid (Spans 5 cols) */}
          <div style={{ gridColumn: "span 5", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Total Score</span>
                <span style={{ color: theme.textMuted }}>📄</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px" }}>{score} <span style={{ fontSize: "1.1rem", color: theme.textMuted }}>/ {total}</span></h2>
                <p style={{ color: theme.green, fontSize: "0.75rem", fontWeight: 500 }}>{EXAM_LABEL[exam] || exam.toUpperCase()} Mock Test</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Percentile</span>
                <span style={{ color: theme.textMuted }}>🏆</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px" }}>{percentile}%</h2>
                <p style={{ color: theme.green, fontSize: "0.75rem", fontWeight: 500 }}>Top {100 - percentile}% of candidates</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Accuracy</span>
                <span style={{ color: theme.textMuted }}>🎯</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px" }}>{accuracy}%</h2>
                <p style={{ color: accuracy >= 70 ? theme.green : theme.red, fontSize: "0.75rem", fontWeight: 500 }}>
                  {correct} correct out of {correct + wrong} attempted
                </p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Avg Time/Q</span>
                <span style={{ color: theme.textMuted }}>⏱️</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px" }}>{pacePerQ}s</h2>
                <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}>Total time: {Math.floor(timeUsed / 60)}m {timeUsed % 60}s</p>
              </div>
            </div>

          </div>

          {/* TOP RIGHT: Bar Chart - Subject Performance (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>Subject Performance Score</span>
              <span style={{ border: theme.border, padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", color: theme.textMuted }}>Bar Analytics</span>
            </div>
            <div style={{ flex: 1, minHeight: "220px" }}>
              {chartBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartBreakdown} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                    <Bar dataKey="displayScore" radius={[6, 6, 6, 6]} barSize={28}>
                      {chartBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === highestScoreIdx ? theme.accentPurple : theme.barMuted} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No subject breakdown available</div>
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: Line Chart - Attempt Distribution Trend (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>Attempt Distribution Trend</span>
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.green }}>●</span> Correct</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.red }}>●</span> Wrong</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.accentYellow }}>●</span> Skipped</div>
            </div>

            <div style={{ flex: 1, minHeight: "200px" }}>
              {chartBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" name="Correct" dataKey="correct" stroke={theme.green} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Wrong" dataKey="wrong" stroke={theme.red} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Skipped" dataKey="skipped" stroke={theme.accentYellow} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No distribution data</div>
              )}
            </div>
          </div>

          {/* BOTTOM RIGHT: Donut Chart - Accuracy Breakdown (Spans 5 cols) */}
          <div style={{ ...G.card, gridColumn: "span 5", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>Accuracy Breakdown</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", flex: 1, position: "relative" }}>
              
              {/* Left Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                <div>
                  <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{accuracy}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}>Accuracy Rate</p>
                </div>
                <div>
                  <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{totalQuestions > 0 ? Math.round(((wrong + skipped)/totalQuestions)*100) : 0}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}>Error / Skip Rate</p>
                </div>
              </div>

              {/* Center Donut Chart */}
              <div style={{ width: "170px", height: "170px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ color: "white", fontSize: "1.2rem", fontWeight: 600 }}>{totalQuestions}</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.65rem" }}>Total Q's</p>
                </div>
              </div>

              {/* Right Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, alignItems: "flex-end", textAlign: "right" }}>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.green }}>●</span> Correct</p>
                  <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{correct}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.red }}>●</span> Wrong</p>
                  <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{wrong}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.textMuted }}>●</span> Skipped</p>
                  <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{skipped}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* Responsive layout breakpoint handler */}
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