"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Grid, Clock, CheckCircle2, AlertCircle, Bookmark, ArrowLeft, ArrowRight, Send, Menu, X } from "lucide-react";
import { getQuestionsForTest, saveTestResult, TestResult } from "@/lib/questionBank";
import { testService } from "@/services/testService";
import { gradAmberDeep } from "@/lib/theme";

const G = { grad: gradAmberDeep };

type AnswerMap = Record<number, number>;
type MarkedSet = Set<number>;

export default function TestPage() {
  const params = useParams();
  const testId = String(params?.id ?? "1");

  // Question data + metadata now come from the single shared source
  // (src/lib/questionBank.ts) instead of being duplicated in this file.
  // getQuestionsForTest already handles the same fallbacks this page used
  // to do manually: unknown testId → test "1", unknown exam → JEE bank.
  const { meta, questions } = useMemo(() => getQuestionsForTest(testId), [testId]);

  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<AnswerMap>({});
  const [marked, setMarked]     = useState<MarkedSet>(new Set());
  const [visited, setVisited]   = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(meta.duration * 60);
  const [confirm, setConfirm]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  
  // Mounted state for hydration fix
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const submit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const wrong   = questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correct).length;
    const skipped = questions.length - correct - wrong;
    const score   = correct * 4 - (meta.negMark ? wrong : 0);
    const total   = questions.length * 4;
    const accuracy = (correct + wrong) > 0 ? Math.round(correct / (correct + wrong) * 100) : 0;
    const timeUsed = meta.duration * 60 - timeLeft;

    const map: Record<string, { correct:number; wrong:number; skipped:number }> = {};
    questions.forEach((q, i) => {
      if (!map[q.subject]) map[q.subject] = { correct:0, wrong:0, skipped:0 };
      const a = answers[i];
      if (a === undefined)      map[q.subject].skipped++;
      else if (a === q.correct) map[q.subject].correct++;
      else                      map[q.subject].wrong++;
    });
    const subjectBreakdown = Object.entries(map).map(([subject, d]) => ({
      subject, ...d,
      accuracy: (d.correct + d.wrong) > 0 ? Math.round(d.correct / (d.correct + d.wrong) * 100) : 0,
    }));

    const result: TestResult = {
      testId, title: meta.title, exam: meta.exam,
      score, total, correct, wrong, skipped, accuracy, timeUsed,
      date: new Date().toISOString(), subjectBreakdown,
    };

    // Local save first — instant, always succeeds offline, and is what the
    // result page falls back to if the Supabase save below fails or is slow.
    saveTestResult(result);

    // Save to Supabase too, so this result shows up in the AI Test Analysis
    // feature (mock-test-assistant) and syncs across devices — previously
    // only /practice wrote here, so every mock test taken through this page
    // was invisible to that feature. subject_breakdown is reshaped from an
    // array to a Record<subject, stats> to match testService's schema.
    let savedId: string | null = null;
    try {
      const subjectBreakdownRecord: Record<string, { correct: number; wrong: number; skipped: number; total: number; accuracy: number }> = {};
      subjectBreakdown.forEach((s) => {
        subjectBreakdownRecord[s.subject] = {
          correct: s.correct,
          wrong: s.wrong,
          skipped: s.skipped,
          total: s.correct + s.wrong + s.skipped,
          accuracy: s.accuracy,
        };
      });

      const saved = await testService.saveResult({
        test_id: testId,
        title: meta.title,
        exam: meta.exam,
        score,
        total,
        correct,
        wrong,
        skipped,
        accuracy,
        time_used: timeUsed,
        subject_breakdown: subjectBreakdownRecord,
      });
      savedId = saved?.id ?? null;
    } catch (err) {
      // Not logged in, offline, or a transient Supabase error — the local
      // save above already succeeded, so the result page can still show the
      // score. It just won't appear in cross-device history / AI analysis
      // until the next successful sync.
      console.error("Could not save test result to Supabase:", err);
    }

    const qs = new URLSearchParams({
      correct: String(correct), wrong: String(wrong), skipped: String(skipped),
      score: String(score), total: String(total), timeUsed: String(timeUsed),
      exam: meta.exam, title: meta.title,
    });
    if (savedId) qs.set("id", savedId);

    window.location.href = `/mock-tests/result?${qs.toString()}`;
  }, [submitted, questions, answers, meta, testId, timeLeft]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) { submit(); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submit]);

  // Warn before leaving the tab/page while a test is in progress — without
  // this, closing the tab or hitting the browser back button silently loses
  // all answered questions with no confirmation.
  useEffect(() => {
    if (submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitted]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    const h = Math.floor(m / 60);
    return h > 0
      ? `${h}:${String(m % 60).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
      : `${m}:${String(sec).padStart(2,"0")}`;
  };

  const goTo = (i: number) => {
    setCurrent(i);
    setVisited(prev => new Set(prev).add(i));
    setPaletteOpen(false);
  };

  const toggleMark = () => {
    setMarked(prev => {
      const n = new Set(prev);
      n.has(current) ? n.delete(current) : n.add(current);
      return n;
    });
  };

  const dotStyle = (i: number) => {
    const isAns   = answers[i] !== undefined;
    const isMark  = marked.has(i);
    const isVisit = visited.has(i);
    if (isAns && isMark)  return { bg:"#8B5CF6", color:"white", border:"2px solid #22C55E" };
    if (isAns)            return { bg:"#22C55E", color:"#FFFFFF", border:"none" };
    if (isMark)           return { bg:"#8B5CF6", color:"white",   border:"none" };
    if (isVisit)          return { bg:"rgba(239,68,68,0.15)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.4)" };
    return { bg:"var(--theme-hover-bg)", color:"var(--theme-text-sub)", border:"1px solid var(--theme-border)" };
  };

  const q = questions[current];
  const timeUrgent = timeLeft < 60;
  const answeredCount = Object.keys(answers).length;

  if (!isMounted) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--theme-bg-main)", display: "flex",
        alignItems: "center", justifyContent: "center", color: "var(--theme-text-sub)",
        fontFamily: "'Inter',sans-serif", fontSize: "1.1rem", fontWeight: 600
      }}>
        ⏳ Loading test...
      </div>
    );
  }

  if (!q) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--theme-bg-main)", color:"var(--theme-text-main)", fontFamily:"'Inter',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <header style={{ background:"var(--theme-card-bg)", borderBottom:"1px solid var(--theme-border)", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 8px rgba(0,0,0,0.02)" }}>
        <div>
          <p style={{ fontSize:"0.95rem", fontWeight:800, color:"var(--theme-text-main)" }}>{meta.title}</p>
          <p style={{ fontSize:"0.75rem", color:"var(--theme-text-sub)", fontWeight:500 }}>Question {current+1} of {questions.length} · <span style={{ color:"var(--theme-accent)", fontWeight:700 }}>{q.subject}</span></p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 14px", borderRadius:"10px", background: timeUrgent ? "rgba(239,68,68,0.08)" : "var(--theme-accent-soft)", border:`1px solid ${timeUrgent ? "rgba(239,68,68,0.3)" : "var(--theme-accent-border)"}` }}>
            <Clock size={16} color={timeUrgent ? "#EF4444" : "var(--theme-accent)"} />
            <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:"0.95rem", color: timeUrgent ? "#EF4444" : "var(--theme-accent)" }}>{fmtTime(timeLeft)}</span>
          </div>

          <button onClick={() => setConfirm(true)} style={{ padding:"9px 18px", borderRadius:"10px", background:G.grad, border:"none", color:"var(--theme-accent-text)", fontWeight:800, fontSize:"0.85rem", cursor:"pointer", boxShadow:"0 4px 12px var(--theme-accent-glow)" }}>
            Submit Test
          </button>

          {/* Mobile palette toggle */}
          <button onClick={() => setPaletteOpen(true)} className="mobile-palette-btn" style={{ display:"none", padding:"9px", borderRadius:"10px", background:"var(--theme-card-bg)", border:"1px solid var(--theme-border)", color:"var(--theme-text-main)", cursor:"pointer" }}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", maxWidth:"1400px", width:"100%", margin:"0 auto" }} className="test-grid-container">

        {/* Question panel */}
        <div style={{ padding:"28px 24px", maxWidth:"840px", boxSizing: "border-box" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px", flexWrap: "wrap" }}>
            <span style={{ fontSize:"0.75rem", fontWeight:800, color:"var(--theme-accent)", background:"var(--theme-accent-soft)", border:"1px solid var(--theme-accent-border)", borderRadius:"100px", padding:"4px 12px" }}>
              Question {current+1}
            </span>
            {meta.negMark && <span style={{ fontSize:"0.75rem", color:"var(--theme-text-sub)", fontWeight:500 }}>+4 correct · −1 negative marking</span>}
          </div>

          <h2 style={{ fontSize:"1.15rem", fontWeight:700, lineHeight:1.65, marginBottom:"28px", color:"var(--theme-text-main)" }}>{q.text}</h2>

          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {q.options.map((opt, i) => {
              const sel = answers[current] === i;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [current]: i }))} style={{
                  display:"flex", alignItems:"center", gap:"14px", padding:"16px 20px", textAlign:"left",
                  borderRadius:"14px", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:"0.9rem", fontWeight: 500,
                  border: sel ? "1.5px solid var(--theme-accent)" : "1px solid var(--theme-border)",
                  background: sel ? "var(--theme-accent-soft)" : "var(--theme-card-bg)",
                  color: sel ? "var(--theme-text-main)" : "var(--theme-text-sub)", boxShadow: sel ? "0 4px 14px var(--theme-accent-glow)" : "0 2px 6px rgba(0,0,0,0.02)",
                  transition:"all 0.18s", boxSizing: "border-box"
                }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:800, background: sel ? G.grad : "var(--theme-hover-bg)", color: sel ? "var(--theme-accent-text)" : "var(--theme-text-sub)" }}>
                    {String.fromCharCode(65+i)}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"36px", flexWrap:"wrap", gap:"12px" }}>
            <button onClick={() => goTo(Math.max(0, current-1))} disabled={current===0} style={{ padding:"11px 20px", borderRadius:"12px", border:"1px solid var(--theme-border)", background:"var(--theme-card-bg)", color: current===0 ? "var(--theme-text-sub)" : "var(--theme-text-main)", fontWeight:700, fontSize:"0.85rem", cursor: current===0 ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 2px 6px rgba(0,0,0,0.02)" }}>
              <ArrowLeft size={16} /> Previous
            </button>
            <button onClick={toggleMark} style={{ padding:"11px 20px", borderRadius:"12px", border:"1px solid rgba(139,92,246,0.3)", background: marked.has(current) ? "rgba(139,92,246,0.1)" : "var(--theme-card-bg)", color:"#7C3AED", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 2px 6px rgba(0,0,0,0.02)" }}>
              <Bookmark size={16} /> {marked.has(current) ? "★ Marked" : "☆ Mark for Review"}
            </button>
            <button onClick={() => goTo(Math.min(questions.length-1, current+1))} disabled={current===questions.length-1} style={{ padding:"11px 20px", borderRadius:"12px", border:"none", background: current===questions.length-1 ? "var(--theme-border)" : G.grad, color: current===questions.length-1 ? "var(--theme-text-sub)" : "var(--theme-accent-text)", fontWeight:700, fontSize:"0.85rem", cursor: current===questions.length-1 ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:"6px", boxShadow: current===questions.length-1 ? "none" : "0 4px 12px var(--theme-accent-glow)" }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Question navigator desktop sidebar */}
        <div style={{ background:"var(--theme-card-bg)", borderLeft:"1px solid var(--theme-border)", padding:"24px", display:"flex", flexDirection:"column", gap:"20px", boxSizing: "border-box" }} className="desktop-palette">
          <h3 style={{ fontSize:"0.95rem", fontWeight:800, color:"var(--theme-text-main)" }}>Question Palette</h3>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {[
              { color:"#22C55E", label:"Answered",         count: answeredCount },
              { color:"#8B5CF6", label:"Marked for Review", count: marked.size },
              { color:"#EF4444", label:"Not Answered",      count: visited.size - answeredCount },
              { color:"var(--theme-hover-bg)", border:"1px solid var(--theme-border)", label:"Not Visited", count: questions.length - visited.size },
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"0.78rem", fontWeight:500 }}>
                <span style={{ width:"12px", height:"12px", borderRadius:"4px", background:l.color, border:l.border || "none", flexShrink:0 }} />
                <span style={{ color:"var(--theme-text-sub)", flex:1 }}>{l.label}</span>
                <span style={{ color:"var(--theme-text-main)", fontWeight:700, fontFamily:"monospace" }}>{l.count}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"var(--theme-text-sub)", marginBottom:"6px", fontWeight:600 }}>
              <span>Progress</span>
              <span style={{ color:"var(--theme-accent)", fontFamily:"monospace" }}>{answeredCount}/{questions.length}</span>
            </div>
            <div style={{ height:"6px", background:"var(--theme-hover-bg)", borderRadius:"3px", overflow:"hidden", border:"1px solid var(--theme-border)" }}>
              <div style={{ height:"100%", width:`${(answeredCount/questions.length)*100}%`, background:G.grad, transition:"width 0.3s" }} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"8px", overflowY:"auto", maxHeight:"320px", paddingRight:"4px" }}>
            {questions.map((_, i) => {
              const ds = dotStyle(i);
              return (
                <button key={i} onClick={() => goTo(i)} style={{ aspectRatio:"1", borderRadius:"8px", fontSize:"0.78rem", fontWeight:800, cursor:"pointer", background:ds.bg, color:ds.color, border: current===i ? "2px solid var(--theme-accent)" : ds.border, transition:"all 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.02)" }}>
                  {i+1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Question Palette Modal */}
      {paletteOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", justifyContent:"flex-end" }} className="mobile-palette-modal">
          <div style={{ width:"100%", maxWidth:"340px", background:"var(--theme-card-bg)", height:"100%", padding:"24px", display:"flex", flexDirection:"column", gap:"20px", overflowY:"auto", borderLeft:"1px solid var(--theme-border)", boxSizing: "border-box" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontSize:"1.05rem", fontWeight:800, color:"var(--theme-text-main)" }}>Question Palette</h3>
              <button onClick={() => setPaletteOpen(false)} style={{ background:"transparent", border:"none", color:"var(--theme-text-sub)", cursor:"pointer" }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                { color:"#22C55E", label:"Answered",         count: answeredCount },
                { color:"#8B5CF6", label:"Marked for Review", count: marked.size },
                { color:"#EF4444", label:"Not Answered",      count: visited.size - answeredCount },
                { color:"var(--theme-hover-bg)", border:"1px solid var(--theme-border)", label:"Not Visited", count: questions.length - visited.size },
              ].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"0.8rem", fontWeight:500 }}>
                  <span style={{ width:"12px", height:"12px", borderRadius:"4px", background:l.color, border:l.border || "none", flexShrink:0 }} />
                  <span style={{ color:"var(--theme-text-sub)", flex:1 }}>{l.label}</span>
                  <span style={{ color:"var(--theme-text-main)", fontWeight:700, fontFamily:"monospace" }}>{l.count}</span>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"8px" }}>
              {questions.map((_, i) => {
                const ds = dotStyle(i);
                return (
                  <button key={i} onClick={() => goTo(i)} style={{ aspectRatio:"1", borderRadius:"8px", fontSize:"0.8rem", fontWeight:800, cursor:"pointer", background:ds.bg, color:ds.color, border: current===i ? "2px solid var(--theme-accent)" : ds.border }}>
                    {i+1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Submit modal */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
          <div style={{ background:"var(--theme-card-bg)", border:"1px solid var(--theme-border)", borderRadius:"20px", padding:"32px", maxWidth:"400px", width:"100%", boxShadow:"0 20px 40px rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
            <h3 style={{ fontSize:"1.2rem", fontWeight:800, marginBottom:"12px", color:"var(--theme-text-main)" }}>Submit Test?</h3>
            <p style={{ fontSize:"0.9rem", color:"var(--theme-text-sub)", lineHeight:1.6, marginBottom:"24px", fontWeight: 500 }}>
              You&apos;ve answered <strong style={{ color:"#22C55E" }}>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} unanswered.`}
            </p>
            <div style={{ display:"flex", gap:"12px" }}>
              <button onClick={() => setConfirm(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"1px solid var(--theme-border)", background:"var(--theme-card-bg)", color:"var(--theme-text-main)", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>Continue Test</button>
              <button onClick={submit} style={{ flex:1, padding:"12px", borderRadius:"12px", border:"none", background:G.grad, color:"var(--theme-accent-text)", fontWeight:800, fontSize:"0.85rem", cursor:"pointer", boxShadow:"0 4px 12px var(--theme-accent-glow)" }}>Submit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Media Queries */}
      <style jsx global>{`
        @media(max-width:900px) {
          .test-grid-container {
            grid-template-columns: 1fr !important;
          }
          .desktop-palette {
            display: none !important;
          }
          .mobile-palette-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}