"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

const G = { grad: "linear-gradient(120deg,#F59E0B,#F97316)" };

// ══════════════════════════════════════════
// QUESTION BANKS — exam-wise
// ══════════════════════════════════════════
const JEE_Q = [
  { id:1, subject:"Physics", text:"A particle moves in a circle of radius r with constant speed v. What is the magnitude of its acceleration?", options:["v/r","v²/r","vr","v²r"], correct:1 },
  { id:2, subject:"Physics", text:"The SI unit of electric flux is:", options:["Weber","Volt-meter","Newton/Coulomb","Tesla"], correct:1 },
  { id:3, subject:"Physics", text:"Which law states that current is directly proportional to voltage?", options:["Faraday's Law","Ohm's Law","Lenz's Law","Coulomb's Law"], correct:1 },
  { id:4, subject:"Physics", text:"The escape velocity from Earth's surface is approximately:", options:["7.9 km/s","9.8 km/s","11.2 km/s","15.0 km/s"], correct:2 },
  { id:5, subject:"Chemistry", text:"Which of the following has the highest boiling point?", options:["HF","HCl","HBr","HI"], correct:0 },
  { id:6, subject:"Chemistry", text:"The oxidation state of Mn in KMnO₄ is:", options:["+5","+6","+7","+4"], correct:2 },
  { id:7, subject:"Chemistry", text:"What is the hybridization of carbon in methane (CH₄)?", options:["sp","sp²","sp³","sp³d"], correct:2 },
  { id:8, subject:"Maths", text:"If f(x) = x³ - 3x + 2, find f'(x) at x = 2.", options:["9","12","6","15"], correct:0 },
  { id:9, subject:"Maths", text:"The value of ∫₀^π sin(x) dx is:", options:["0","1","2","π"], correct:2 },
  { id:10, subject:"Maths", text:"The number of ways to arrange 5 distinct objects is:", options:["20","60","120","24"], correct:2 },
];

const NEET_Q = [
  { id:1, subject:"Biology", text:"Which organelle is known as the powerhouse of the cell?", options:["Nucleus","Ribosome","Mitochondria","Golgi body"], correct:2 },
  { id:2, subject:"Biology", text:"The functional unit of the kidney is called:", options:["Neuron","Nephron","Alveolus","Hepatocyte"], correct:1 },
  { id:3, subject:"Biology", text:"DNA replication occurs during which phase of the cell cycle?", options:["G1 phase","S phase","G2 phase","M phase"], correct:1 },
  { id:4, subject:"Biology", text:"Which hormone regulates blood sugar levels?", options:["Thyroxine","Insulin","Adrenaline","Estrogen"], correct:1 },
  { id:5, subject:"Physics", text:"The unit of electric resistance is:", options:["Ampere","Volt","Ohm","Watt"], correct:2 },
  { id:6, subject:"Physics", text:"Which mirror is used in a vehicle's rear-view mirror?", options:["Concave","Convex","Plane","Cylindrical"], correct:1 },
  { id:7, subject:"Physics", text:"The SI unit of force is:", options:["Joule","Newton","Pascal","Watt"], correct:1 },
  { id:8, subject:"Chemistry", text:"Which gas is most abundant in Earth's atmosphere?", options:["Oxygen","Carbon Dioxide","Nitrogen","Argon"], correct:2 },
  { id:9, subject:"Chemistry", text:"The pH of pure water at 25°C is:", options:["6","7","8","0"], correct:1 },
  { id:10, subject:"Chemistry", text:"Which element has the atomic number 6?", options:["Oxygen","Nitrogen","Carbon","Boron"], correct:2 },
];

const UPSC_Q = [
  { id:1, subject:"Polity", text:"Which Article of the Indian Constitution deals with the Right to Equality?", options:["Article 14","Article 19","Article 21","Article 32"], correct:0 },
  { id:2, subject:"Polity", text:"The Constitution of India was adopted on:", options:["15 August 1947","26 January 1950","26 November 1949","2 October 1950"], correct:2 },
  { id:3, subject:"Polity", text:"Who is the head of the Indian state?", options:["Prime Minister","Chief Justice","President","Speaker of Lok Sabha"], correct:2 },
  { id:4, subject:"History", text:"The Quit India Movement was launched in:", options:["1940","1942","1945","1947"], correct:1 },
  { id:5, subject:"History", text:"Who founded the Indian National Congress in 1885?", options:["Mahatma Gandhi","A.O. Hume","Jawaharlal Nehru","B.R. Ambedkar"], correct:1 },
  { id:6, subject:"History", text:"The Battle of Plassey was fought in:", options:["1757","1764","1857","1761"], correct:0 },
  { id:7, subject:"Geography", text:"Which is the longest river in India?", options:["Yamuna","Brahmaputra","Ganga","Godavari"], correct:2 },
  { id:8, subject:"Geography", text:"The Tropic of Cancer passes through how many Indian states?", options:["6","7","8","9"], correct:2 },
  { id:9, subject:"Economy", text:"The Reserve Bank of India was established in:", options:["1935","1947","1950","1969"], correct:0 },
  { id:10, subject:"Economy", text:"Which Five-Year Plan focused on the Green Revolution?", options:["1st","2nd","3rd","4th"], correct:2 },
];

const SSC_Q = [
  { id:1, subject:"Reasoning", text:"Find the odd one out: Dog, Cat, Lion, Sparrow", options:["Dog","Cat","Lion","Sparrow"], correct:3 },
  { id:2, subject:"Reasoning", text:"If A=1, B=2, C=3... what does 'CAB' equal?", options:["312","321","213","123"], correct:0 },
  { id:3, subject:"Quant", text:"What is 15% of 240?", options:["32","36","40","42"], correct:1 },
  { id:4, subject:"Quant", text:"If a train travels 360 km in 4 hours, its speed is:", options:["80 km/h","90 km/h","100 km/h","75 km/h"], correct:1 },
  { id:5, subject:"English", text:"Choose the correct synonym for 'Abundant':", options:["Scarce","Plentiful","Limited","Rare"], correct:1 },
  { id:6, subject:"English", text:"Identify the correctly spelled word:", options:["Recieve","Receive","Receeve","Receve"], correct:1 },
  { id:7, subject:"GK", text:"Who is known as the 'Father of the Indian Constitution'?", options:["Mahatma Gandhi","Jawaharlal Nehru","B.R. Ambedkar","Sardar Patel"], correct:2 },
  { id:8, subject:"GK", text:"The headquarters of the United Nations is located in:", options:["Geneva","Paris","New York","London"], correct:2 },
  { id:9, subject:"Quant", text:"The simple interest on ₹5000 at 8% per annum for 2 years is:", options:["₹600","₹700","₹800","₹900"], correct:2 },
  { id:10, subject:"Reasoning", text:"Complete the series: 2, 6, 12, 20, 30, ?", options:["40","42","44","36"], correct:1 },
];

const TEST_META: Record<string, { title: string; exam: string; duration: number; negMark: boolean }> = {
  "1":  { title:"JEE Main Full Mock Test #14",    exam:"jee",  duration:30, negMark:true  },
  "2":  { title:"Mechanics — Topic Test",          exam:"jee",  duration:20, negMark:true  },
  "3":  { title:"Organic Chemistry — Chapter 8",   exam:"jee",  duration:20, negMark:true  },
  "4":  { title:"NEET Biology Full Mock #9",       exam:"neet", duration:30, negMark:true  },
  "5":  { title:"Human Physiology — Topic Test",   exam:"neet", duration:15, negMark:true  },
  "6":  { title:"NEET PYQ 2024 — Full Paper",      exam:"neet", duration:30, negMark:true  },
  "7":  { title:"UPSC Prelims Full Mock #21",      exam:"upsc", duration:30, negMark:true  },
  "8":  { title:"Indian Polity — Topic Test",      exam:"upsc", duration:15, negMark:true  },
  "9":  { title:"Modern History — Chapter Test",   exam:"upsc", duration:15, negMark:true  },
  "10": { title:"UPSC Prelims PYQ 2023",           exam:"upsc", duration:30, negMark:true  },
  "11": { title:"Daily Practice — Algebra",        exam:"jee",  duration:10, negMark:false },
  "12": { title:"Daily Practice — Cell Biology",   exam:"neet", duration:10, negMark:false },
  "13": { title:"PW Test Series — JEE Mock #5",   exam:"jee",  duration:30, negMark:true  },
  "14": { title:"Resonance — Calculus Special",    exam:"jee",  duration:20, negMark:true  },
  "15": { title:"SSC CGL Full Mock #7",            exam:"ssc",  duration:20, negMark:true  },
};

const BANKS: Record<string, typeof JEE_Q> = { jee:JEE_Q, neet:NEET_Q, upsc:UPSC_Q, ssc:SSC_Q };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveResult(data: object) {
  try {
    const prev = JSON.parse(localStorage.getItem("mentora_test_results") || "[]");
    localStorage.setItem("mentora_test_results", JSON.stringify([data, ...prev].slice(0, 50)));
  } catch { /* ignore */ }
}

type AnswerMap = Record<number, number>;
type MarkedSet = Set<number>;

export default function TestPage() {
  const params = useParams();
  const testId = String(params?.id ?? "1");
  const meta = TEST_META[testId] ?? TEST_META["1"];

  const questions = useMemo(() => {
    const bank = BANKS[meta.exam] ?? JEE_Q;
    return shuffle(bank);
  }, [meta.exam]);

  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<AnswerMap>({});
  const [marked, setMarked]     = useState<MarkedSet>(new Set());
  const [visited, setVisited]   = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(meta.duration * 60);
  const [confirm, setConfirm]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Mounted state for hydration fix
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const submit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const wrong   = questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correct).length;
    const skipped = questions.length - correct - wrong;
    const score   = correct * 4 - (meta.negMark ? wrong : 0);
    const total   = questions.length * 4;
    const accuracy = (correct + wrong) > 0 ? Math.round(correct / (correct + wrong) * 100) : 0;
    const timeUsed = meta.duration * 60 - timeLeft;

    // Subject breakdown
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

    const result = {
      testId, title: meta.title, exam: meta.exam,
      score, total, correct, wrong, skipped, accuracy, timeUsed,
      date: new Date().toISOString(), subjectBreakdown,
    };

    saveResult(result);

    // Build URL params as backup
    const qs = new URLSearchParams({
      correct: String(correct), wrong: String(wrong), skipped: String(skipped),
      score: String(score), total: String(total), timeUsed: String(timeUsed),
      exam: meta.exam, title: meta.title,
    });

    // Use window.location for guaranteed navigation
    window.location.href = `/mock-tests/result?${qs.toString()}`;
  }, [submitted, questions, answers, meta, testId, timeLeft]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) { submit(); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submit]);

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
  };

  const toggleMark = () => {
    setMarked(prev => {
      const n = new Set(prev);
      n.has(current) ? n.delete(current) : n.add(current);
      return n;
    });
  };

  const dotStyle = (i: number) => {
    const isAns    = answers[i] !== undefined;
    const isMark   = marked.has(i);
    const isVisit  = visited.has(i);
    const isCur    = current === i;
    if (isAns && isMark)  return { bg:"#8B5CF6", color:"white", border:"2px solid #22C55E" };
    if (isAns)            return { bg:"#22C55E", color:"#080C14", border:"none" };
    if (isMark)           return { bg:"#8B5CF6", color:"white",   border:"none" };
    if (isVisit)          return { bg:"rgba(239,68,68,0.15)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.4)" };
    return { bg:"#1A2336", color:"#64748B", border:"none" };
  };

  const q = questions[current];
  const timeUrgent = timeLeft < 60;
  const answeredCount = Object.keys(answers).length;

  if (!isMounted) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080C14", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#94A3B8",
        fontFamily: "'DM Sans',sans-serif", fontSize: "1.1rem"
      }}>
        ⏳ Loading test...
      </div>
    );
  }

  if (!q) return null;

  return (
    <div style={{ minHeight:"100vh", background:"#080C14", color:"white", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <header style={{ background:"#0D1220", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <p style={{ fontSize:"0.95rem", fontWeight:700 }}>{meta.title}</p>
          <p style={{ fontSize:"0.7rem", color:"#64748B" }}>Question {current+1} of {questions.length} · {q.subject}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 16px", borderRadius:"10px", background: timeUrgent ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.1)", border:`1px solid ${timeUrgent ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.25)"}` }}>
            <span>⏱</span>
            <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:"0.95rem", color: timeUrgent ? "#EF4444" : "#F59E0B" }}>{fmtTime(timeLeft)}</span>
          </div>
          <button onClick={() => setConfirm(true)} style={{ padding:"9px 20px", borderRadius:"10px", background:G.grad, border:"none", color:"#080C14", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>
            Submit Test
          </button>
        </div>
      </header>

      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 280px" }}>

        {/* Question panel */}
        <div style={{ padding:"32px", maxWidth:"760px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
            <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#F59E0B", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"100px", padding:"3px 12px" }}>Q{current+1}</span>
            {meta.negMark && <span style={{ fontSize:"0.72rem", color:"#64748B" }}>+4 correct · −1 wrong</span>}
          </div>

          <h2 style={{ fontSize:"1.1rem", fontWeight:600, lineHeight:1.65, marginBottom:"28px", color:"#F1F5F9" }}>{q.text}</h2>

          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {q.options.map((opt, i) => {
              const sel = answers[current] === i;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [current]: i }))} style={{
                  display:"flex", alignItems:"center", gap:"14px", padding:"15px 18px", textAlign:"left",
                  borderRadius:"12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem",
                  border: sel ? "1.5px solid #F59E0B" : "1px solid rgba(255,255,255,0.08)",
                  background: sel ? "rgba(245,158,11,0.08)" : "#111827",
                  color: sel ? "#F8FAFC" : "#CBD5E1", transition:"all 0.18s",
                }}>
                  <div style={{ width:"26px", height:"26px", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, background: sel ? G.grad : "#1A2336", color: sel ? "#080C14" : "#64748B" }}>
                    {String.fromCharCode(65+i)}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"32px" }}>
            <button onClick={() => goTo(Math.max(0, current-1))} disabled={current===0} style={{ padding:"11px 22px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.08)", background:"#111827", color: current===0 ? "#334155" : "#CBD5E1", fontWeight:600, fontSize:"0.85rem", cursor: current===0 ? "not-allowed" : "pointer" }}>← Previous</button>
            <button onClick={toggleMark} style={{ padding:"11px 22px", borderRadius:"10px", border:"1px solid rgba(139,92,246,0.3)", background: marked.has(current) ? "rgba(139,92,246,0.15)" : "transparent", color:"#A78BFA", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
              {marked.has(current) ? "★ Marked" : "☆ Mark for Review"}
            </button>
            <button onClick={() => goTo(Math.min(questions.length-1, current+1))} disabled={current===questions.length-1} style={{ padding:"11px 22px", borderRadius:"10px", border:"none", background: current===questions.length-1 ? "#1A2336" : G.grad, color: current===questions.length-1 ? "#334155" : "#080C14", fontWeight:700, fontSize:"0.85rem", cursor: current===questions.length-1 ? "not-allowed" : "pointer" }}>Next →</button>
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ background:"#0D1220", borderLeft:"1px solid rgba(255,255,255,0.07)", padding:"20px", display:"flex", flexDirection:"column", gap:"18px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              { color:"#22C55E", label:"Answered",         count: answeredCount },
              { color:"#8B5CF6", label:"Marked for Review", count: marked.size },
              { color:"#EF4444", label:"Not Answered",      count: visited.size - answeredCount },
              { color:"#334155", label:"Not Visited",       count: questions.length - visited.size },
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"0.74rem" }}>
                <span style={{ width:"10px", height:"10px", borderRadius:"3px", background:l.color, flexShrink:0 }} />
                <span style={{ color:"#94A3B8", flex:1 }}>{l.label}</span>
                <span style={{ color:"#64748B", fontFamily:"monospace" }}>{l.count}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"#64748B", marginBottom:"6px" }}>
              <span>Progress</span>
              <span style={{ color:"#F59E0B", fontFamily:"monospace" }}>{answeredCount}/{questions.length}</span>
            </div>
            <div style={{ height:"5px", background:"#1A2336", borderRadius:"3px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(answeredCount/questions.length)*100}%`, background:G.grad, transition:"width 0.3s" }} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"7px" }}>
            {questions.map((_, i) => {
              const ds = dotStyle(i);
              return (
                <button key={i} onClick={() => goTo(i)} style={{ aspectRatio:"1", borderRadius:"8px", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", background:ds.bg, color:ds.color, border: current===i ? "2px solid #F59E0B" : ds.border, transition:"all 0.15s" }}>
                  {i+1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
          <div style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"32px", maxWidth:"400px", width:"100%" }}>
            <h3 style={{ fontSize:"1.2rem", fontWeight:700, marginBottom:"12px" }}>Submit Test?</h3>
            <p style={{ fontSize:"0.85rem", color:"#94A3B8", lineHeight:1.6, marginBottom:"20px" }}>
              You&apos;ve answered <strong style={{ color:"#22C55E" }}>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} unanswered.`}
            </p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setConfirm(false)} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"#CBD5E1", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>Continue Test</button>
              <button onClick={submit} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background:G.grad, color:"#080C14", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>Submit Now</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:900px){div[style*="1fr 280px"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}