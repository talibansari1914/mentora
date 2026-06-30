"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px" },
};

// ══════════════════════════════════════════
// Load real test results from localStorage + dummy weekly data
// ══════════════════════════════════════════
type TestResult = {
  testId: string; title: string; exam: string;
  score: number; total: number; correct: number; wrong: number;
  skipped: number; accuracy: number; timeUsed: number; date: string;
  subjectBreakdown: { subject: string; correct: number; wrong: number; skipped: number; accuracy: number }[];
};

function loadResults(): TestResult[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("mentora_test_results") || "[]"); } catch { return []; }
}

// Dummy weekly study hours (will be real when backend connects)
const WEEKLY_HOURS = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 5.0 },
  { day: "Wed", hours: 2.0 },
  { day: "Thu", hours: 6.5 },
  { day: "Fri", hours: 4.0 },
  { day: "Sat", hours: 7.0 },
  { day: "Sun", hours: 3.0 },
];

const SUBJECT_GOALS = [
  { subject: "Polity",    target: 80, color: "#6366F1" },
  { subject: "History",   target: 75, color: "#F59E0B" },
  { subject: "Geography", target: 70, color: "#22C55E" },
  { subject: "Economy",   target: 65, color: "#EF4444" },
  { subject: "Environment", target: 60, color: "#06B6D4" },
];

export default function AnalyticsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [tab, setTab] = useState<"overview"|"tests"|"subjects">("overview");

  useEffect(() => { setResults(loadResults()); }, []);

  // Compute stats from real data
  const totalTests = results.length;
  const avgAccuracy = totalTests > 0 ? Math.round(results.reduce((s, r) => s + r.accuracy, 0) / totalTests) : 0;
  const avgScore = totalTests > 0 ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.total) * 100), 0) / totalTests) : 0;
  const totalTimeMin = Math.round(results.reduce((s, r) => s + r.timeUsed, 0) / 60);
  const bestScore = totalTests > 0 ? Math.max(...results.map(r => Math.round((r.score / r.total) * 100))) : 0;

  // Score trend from real results (last 7)
  const scoreTrend = results.slice(0, 7).reverse().map((r, i) => ({
    label: `Test ${i + 1}`,
    score: Math.round((r.score / r.total) * 100),
    accuracy: r.accuracy,
  }));

  // Subject aggregate from all results
  const subjectMap: Record<string, { correct: number; wrong: number; skipped: number }> = {};
  results.forEach(r => {
    r.subjectBreakdown?.forEach(s => {
      if (!subjectMap[s.subject]) subjectMap[s.subject] = { correct: 0, wrong: 0, skipped: 0 };
      subjectMap[s.subject].correct += s.correct;
      subjectMap[s.subject].wrong   += s.wrong;
      subjectMap[s.subject].skipped += s.skipped;
    });
  });
  const subjectData = Object.entries(subjectMap).map(([subject, d]) => ({
    subject,
    accuracy: (d.correct + d.wrong) > 0 ? Math.round(d.correct / (d.correct + d.wrong) * 100) : 0,
    total: d.correct + d.wrong + d.skipped,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const weakSubjects   = subjectData.filter(s => s.accuracy < 60);
  const strongSubjects = subjectData.filter(s => s.accuracy >= 70);

  // Pie data overall
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalWrong   = results.reduce((s, r) => s + r.wrong, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const pieData = [
    { name: "Correct", value: totalCorrect, color: "#22C55E" },
    { name: "Wrong",   value: totalWrong,   color: "#EF4444" },
    { name: "Skipped", value: totalSkipped, color: "#475569" },
  ];

  const radarData = subjectData.slice(0, 6).map(s => ({ subject: s.subject, accuracy: s.accuracy }));

  return (
    <div style={{ minHeight:"100vh", background:"#080C14", color:"white", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(8,12,20,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"16px 32px" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:"9px", textDecoration:"none" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:G.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", fontWeight:"bold" }}>⚡</div>
              <span style={{ fontWeight:800, fontSize:"1.2rem", color:"white" }}>Mentor<span style={{ color:"#F59E0B" }}>a</span></span>
            </a>
            <a href="/dashboard" style={{ fontSize:"0.85rem", color:"#64748B", textDecoration:"none" }}>← Dashboard</a>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:"6px" }}>
            {(["overview","tests","subjects"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:"7px 16px", borderRadius:"8px", fontSize:"0.8rem", fontWeight:600, cursor:"pointer", border:"none",
                background: tab===t ? G.grad : "#111827",
                color: tab===t ? "#080C14" : "#64748B",
                transition:"all 0.2s",
              }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"32px 32px 60px" }}>
        <div style={{ marginBottom:"28px" }}>
          <h1 style={{ fontSize:"1.9rem", fontWeight:800, letterSpacing:"-0.025em", marginBottom:"6px" }}>Analytics</h1>
          <p style={{ color:"#64748B", fontSize:"0.9rem" }}>Track your performance, identify weak areas, and improve consistently.</p>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

            {/* KPI Strip */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px" }}>
              {[
                { icon:"📝", val: totalTests, lbl:"Tests Taken",   color:"#818CF8", bg:"rgba(99,102,241,0.12)" },
                { icon:"🎯", val:`${avgAccuracy}%`, lbl:"Avg Accuracy", color:"#22C55E", bg:"rgba(34,197,94,0.1)" },
                { icon:"📊", val:`${avgScore}%`,    lbl:"Avg Score",    color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
                { icon:"🏆", val:`${bestScore}%`,   lbl:"Best Score",   color:"#22D3EE", bg:"rgba(6,182,212,0.1)" },
              ].map(k => (
                <div key={k.lbl} style={{ ...G.card, padding:"18px" }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:k.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", marginBottom:"12px" }}>{k.icon}</div>
                  <div style={{ fontSize:"1.8rem", fontWeight:900, letterSpacing:"-0.03em", color:k.color, lineHeight:1, marginBottom:"4px" }}>{k.val}</div>
                  <div style={{ fontSize:"0.775rem", color:"#64748B" }}>{k.lbl}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:"16px" }}>
              {/* Score trend */}
              <div style={{ ...G.card, padding:"24px" }}>
                <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"16px" }}>Score Trend</h3>
                {scoreTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={scoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} domain={[0,100]} />
                      <Tooltip contentStyle={{ background:"#1A2336", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", fontSize:"0.8rem" }} />
                      <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill:"#F59E0B", r:4 }} />
                      <Line type="monotone" dataKey="accuracy" stroke="#22C55E" strokeWidth={2} dot={{ fill:"#22C55E", r:3 }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"10px" }}>
                    <p style={{ fontSize:"2rem" }}>📈</p>
                    <p style={{ color:"#64748B", fontSize:"0.85rem" }}>Take some tests to see your score trend!</p>
                    <a href="/mock-tests" style={{ color:"#F59E0B", fontSize:"0.8rem", fontWeight:600, textDecoration:"none" }}>Go to Mock Tests →</a>
                  </div>
                )}
                <div style={{ display:"flex", gap:"16px", marginTop:"12px", justifyContent:"center" }}>
                  {[{ color:"#F59E0B", label:"Score %" }, { color:"#22C55E", label:"Accuracy %" }].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"0.72rem" }}>
                      <span style={{ width:"9px", height:"9px", borderRadius:"3px", background:l.color }} />
                      <span style={{ color:"#94A3B8" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall pie */}
              <div style={{ ...G.card, padding:"24px" }}>
                <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"16px" }}>Overall Answer Split</h3>
                {totalCorrect + totalWrong + totalSkipped > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={{ background:"#1A2336", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", fontSize:"0.8rem" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", justifyContent:"center", gap:"14px", marginTop:"8px" }}>
                      {pieData.map(d => (
                        <div key={d.name} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"0.72rem" }}>
                          <span style={{ width:"8px", height:"8px", borderRadius:"2px", background:d.color }} />
                          <span style={{ color:"#94A3B8" }}>{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <p style={{ color:"#475569", fontSize:"0.85rem" }}>No data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly study hours */}
            <div style={{ ...G.card, padding:"24px" }}>
              <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"16px" }}>Weekly Study Hours</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={WEEKLY_HOURS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:"#1A2336", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", fontSize:"0.8rem" }} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="hours" radius={[6,6,0,0]} fill="#6366F1">
                    {WEEKLY_HOURS.map((_, i) => (
                      <Cell key={i} fill={i === new Date().getDay() - 1 ? "#F59E0B" : "#6366F1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Strong / Weak */}
            {subjectData.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div style={{ ...G.card, padding:"20px" }}>
                  <h3 style={{ fontSize:"0.9rem", fontWeight:700, marginBottom:"14px" }}>💪 Strong Topics</h3>
                  {strongSubjects.length > 0 ? strongSubjects.map(s => (
                    <div key={s.subject} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                      <span style={{ fontSize:"0.8rem", color:"#CBD5E1", flex:1 }}>{s.subject}</span>
                      <div style={{ width:"80px", height:"6px", background:"#1A2640", borderRadius:"3px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${s.accuracy}%`, background:"#22C55E", borderRadius:"3px" }} />
                      </div>
                      <span style={{ fontSize:"0.72rem", color:"#22C55E", fontFamily:"monospace", fontWeight:700, width:"36px", textAlign:"right" }}>{s.accuracy}%</span>
                    </div>
                  )) : <p style={{ color:"#475569", fontSize:"0.8rem" }}>Take more tests to see strong topics!</p>}
                </div>
                <div style={{ ...G.card, padding:"20px" }}>
                  <h3 style={{ fontSize:"0.9rem", fontWeight:700, marginBottom:"14px" }}>🎯 Focus Areas</h3>
                  {weakSubjects.length > 0 ? weakSubjects.map(s => (
                    <div key={s.subject} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                      <span style={{ fontSize:"0.8rem", color:"#CBD5E1", flex:1 }}>{s.subject}</span>
                      <div style={{ width:"80px", height:"6px", background:"#1A2640", borderRadius:"3px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${s.accuracy}%`, background:"#EF4444", borderRadius:"3px" }} />
                      </div>
                      <span style={{ fontSize:"0.72rem", color:"#EF4444", fontFamily:"monospace", fontWeight:700, width:"36px", textAlign:"right" }}>{s.accuracy}%</span>
                    </div>
                  )) : <p style={{ color:"#475569", fontSize:"0.8rem" }}>No weak areas detected yet! 🎉</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TESTS TAB ── */}
        {tab === "tests" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {results.length === 0 ? (
              <div style={{ ...G.card, padding:"60px", textAlign:"center" }}>
                <p style={{ fontSize:"3rem", marginBottom:"16px" }}>📝</p>
                <h3 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"8px" }}>No tests taken yet</h3>
                <p style={{ color:"#64748B", fontSize:"0.875rem", marginBottom:"20px" }}>Take a mock test to see your results here!</p>
                <a href="/mock-tests" style={{ padding:"12px 24px", borderRadius:"12px", background:G.grad, color:"#080C14", fontWeight:700, fontSize:"0.9rem", textDecoration:"none" }}>Go to Mock Tests →</a>
              </div>
            ) : results.map((r, i) => {
              const pct = Math.round((r.score / r.total) * 100);
              const level = pct >= 70 ? "high" : pct >= 50 ? "mid" : "low";
              const color = level==="high" ? "#22C55E" : level==="mid" ? "#F59E0B" : "#EF4444";
              const date = new Date(r.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
              return (
                <div key={i} style={{ ...G.card, padding:"20px", display:"flex", alignItems:"center", gap:"16px" }}>
                  <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:`rgba(${level==="high"?"34,197,94":level==="mid"?"245,158,11":"239,68,68"},0.1)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", fontWeight:900, fontFamily:"monospace", color, flexShrink:0 }}>{pct}%</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:"0.95rem", fontWeight:700, color:"white", marginBottom:"4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</p>
                    <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"0.72rem", color:"#F59E0B", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:"100px", padding:"2px 8px" }}>{r.exam.toUpperCase()}</span>
                      <span style={{ fontSize:"0.72rem", color:"#64748B", fontFamily:"monospace" }}>{r.score}/{r.total} pts</span>
                      <span style={{ fontSize:"0.72rem", color:"#64748B", fontFamily:"monospace" }}>Accuracy: {r.accuracy}%</span>
                      <span style={{ fontSize:"0.72rem", color:"#64748B", fontFamily:"monospace" }}>{Math.floor(r.timeUsed/60)}m {r.timeUsed%60}s</span>
                      <span style={{ fontSize:"0.72rem", color:"#475569" }}>{date}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ fontSize:"0.72rem", color:"#64748B", marginBottom:"4px" }}>Correct/Wrong/Skip</p>
                    <p style={{ fontSize:"0.82rem", fontFamily:"monospace" }}>
                      <span style={{ color:"#22C55E" }}>{r.correct}</span>
                      <span style={{ color:"#475569" }}> / </span>
                      <span style={{ color:"#EF4444" }}>{r.wrong}</span>
                      <span style={{ color:"#475569" }}> / </span>
                      <span style={{ color:"#64748B" }}>{r.skipped}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUBJECTS TAB ── */}
        {tab === "subjects" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
            {subjectData.length === 0 ? (
              <div style={{ ...G.card, padding:"60px", textAlign:"center" }}>
                <p style={{ fontSize:"3rem", marginBottom:"16px" }}>📊</p>
                <h3 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"8px" }}>No subject data yet</h3>
                <p style={{ color:"#64748B", fontSize:"0.875rem", marginBottom:"20px" }}>Take tests to see subject-wise breakdown!</p>
                <a href="/mock-tests" style={{ padding:"12px 24px", borderRadius:"12px", background:G.grad, color:"#080C14", fontWeight:700, fontSize:"0.9rem", textDecoration:"none" }}>Take a Test →</a>
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                  <div style={{ ...G.card, padding:"24px" }}>
                    <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"16px" }}>Subject-wise Accuracy</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={subjectData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                        <XAxis type="number" tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} domain={[0,100]} />
                        <YAxis dataKey="subject" type="category" tick={{ fill:"#64748B", fontSize:11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip contentStyle={{ background:"#1A2336", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", fontSize:"0.8rem" }} cursor={{ fill:"rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="accuracy" radius={[0,6,6,0]}>
                          {subjectData.map((e, i) => (
                            <Cell key={i} fill={e.accuracy>=70?"#22C55E":e.accuracy>=50?"#F59E0B":"#EF4444"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {radarData.length >= 3 && (
                    <div style={{ ...G.card, padding:"24px" }}>
                      <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"16px" }}>Strength Radar</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill:"#94A3B8", fontSize:10 }} />
                          <PolarRadiusAxis tick={{ fill:"#475569", fontSize:8 }} domain={[0,100]} />
                          <Radar dataKey="accuracy" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={{ ...G.card, padding:"24px" }}>
                  <h3 style={{ fontSize:"0.95rem", fontWeight:700, marginBottom:"18px" }}>Detailed Subject Breakdown</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                    {subjectData.map(s => (
                      <div key={s.subject} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px", background:"#0D1220", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }}>
                        <span style={{ width:"100px", fontSize:"0.85rem", color:"#CBD5E1", fontWeight:600, flexShrink:0 }}>{s.subject}</span>
                        <div style={{ flex:1, height:"8px", background:"#1A2640", borderRadius:"4px", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${s.accuracy}%`, background: s.accuracy>=70?"#22C55E":s.accuracy>=50?"linear-gradient(90deg,#F59E0B,#F97316)":"#EF4444", borderRadius:"4px", transition:"width 0.6s ease" }} />
                        </div>
                        <span style={{ fontSize:"0.82rem", fontFamily:"monospace", fontWeight:700, width:"44px", textAlign:"right", color: s.accuracy>=70?"#22C55E":s.accuracy>=50?"#F59E0B":"#EF4444" }}>{s.accuracy}%</span>
                        <span style={{ fontSize:"0.7rem", color:"#475569", width:"60px", textAlign:"right" }}>{s.total} qs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:1024px){div[style*="1.5fr 1fr"]{grid-template-columns:1fr!important}div[style*="repeat(4,1fr)"]{grid-template-columns:1fr 1fr!important}}
        @media(max-width:768px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important}div[style*="padding: 32px 32px"]{padding:20px 16px!important}}
      `}</style>
    </div>
  );
}
