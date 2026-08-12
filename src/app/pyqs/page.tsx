"use client";
import { useState, useMemo } from "react";
import { gradAmberOrange } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

const G = { grad: gradAmberOrange };

const EXAMS = ["All", "UPSC", "JEE", "NEET", "SSC"];
const YEARS = ["All Years", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
const TOPICS: Record<string, string[]> = {
  All:  ["All Topics"],
  UPSC: ["All Topics", "Polity", "History", "Geography", "Economy", "Environment", "Science & Tech", "Current Affairs"],
  JEE:  ["All Topics", "Physics", "Chemistry", "Maths"],
  NEET: ["All Topics", "Biology", "Physics", "Chemistry"],
  SSC:  ["All Topics", "Reasoning", "Quant", "English", "GK"],
};

type PYQ = {
  id: number;
  year: number;
  exam: string;
  topic: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};

const PYQS: PYQ[] = [
  { id:1,  year:2023, exam:"UPSC", topic:"Polity",     text:"Which Schedule of the Indian Constitution deals with Anti-Defection Law?", options:["Eighth Schedule","Ninth Schedule","Tenth Schedule","Eleventh Schedule"], correct:2, explanation:"The Tenth Schedule, added by the 52nd Amendment Act 1985, contains provisions related to Anti-Defection Law." },
  { id:2,  year:2023, exam:"UPSC", topic:"History",    text:"The 'Doctrine of Lapse' was introduced by which Governor-General?", options:["Lord Cornwallis","Lord Dalhousie","Lord Wellesley","Lord Canning"], correct:1, explanation:"Lord Dalhousie introduced the Doctrine of Lapse (1848–1856) under which a princely state with no natural heir would be annexed by the British." },
  { id:3,  year:2022, exam:"UPSC", topic:"Geography",  text:"Which of the following rivers flows through a rift valley?", options:["Godavari","Krishna","Narmada","Kaveri"], correct:2, explanation:"The Narmada river flows through a rift valley (graben) formed due to faulting, unlike most Indian rivers that flow through V-shaped valleys." },
  { id:4,  year:2022, exam:"UPSC", topic:"Economy",    text:"The Monetary Policy Committee (MPC) of RBI has how many members?", options:["4","5","6","7"], correct:2, explanation:"MPC has 6 members — 3 from RBI (including Governor as ex-officio chair) and 3 external members appointed by the Government." },
  { id:5,  year:2021, exam:"UPSC", topic:"Environment", text:"Which greenhouse gas has the highest Global Warming Potential (GWP) over 100 years?", options:["CO₂","CH₄","N₂O","SF₆"], correct:3, explanation:"Sulphur hexafluoride (SF₆) has a GWP of approximately 23,500 over 100 years, making it the most potent known greenhouse gas." },
  { id:6,  year:2021, exam:"UPSC", topic:"Polity",     text:"'Judicial Review' in India is based on which concept?", options:["Rule of Law","Due Process of Law","Procedure Established by Law","Constitutional Supremacy"], correct:3, explanation:"Judicial Review in India is based on Constitutional Supremacy — courts can review laws to check if they conform to the Constitution." },
  { id:7,  year:2020, exam:"UPSC", topic:"History",    text:"Who among the following was the founder of the Brahmo Samaj?", options:["Swami Vivekananda","Raja Ram Mohan Roy","Dayanand Saraswati","Gopal Krishna Gokhale"], correct:1, explanation:"Raja Ram Mohan Roy founded the Brahmo Samaj in 1828 in Calcutta. It was a socio-religious reform movement." },
  { id:8,  year:2020, exam:"UPSC", topic:"Science & Tech", text:"What is the approximate wavelength range of visible light?", options:["100-400 nm","400-700 nm","700-1000 nm","1000-1400 nm"], correct:1, explanation:"Visible light occupies the 400-700 nm range of the electromagnetic spectrum — violet at ~400nm to red at ~700nm." },
  { id:9,  year:2024, exam:"JEE",  topic:"Physics",    text:"A body of mass 2 kg is thrown vertically upward with velocity 10 m/s. What is the kinetic energy at the highest point? (g=10 m/s²)", options:["0 J","50 J","100 J","200 J"], correct:0, explanation:"At the highest point, velocity = 0. Therefore, KE = ½mv² = ½×2×0² = 0 J. All kinetic energy has converted to potential energy." },
  { id:10, year:2024, exam:"JEE",  topic:"Chemistry",  text:"Which of the following has the smallest ionic radius?", options:["Na⁺","Mg²⁺","Al³⁺","Si⁴⁺"], correct:3, explanation:"Si⁴⁺ has the smallest ionic radius. In isoelectronic series, higher nuclear charge means smaller size: Si⁴⁺ > Al³⁺ > Mg²⁺ > Na⁺." },
  { id:11, year:2023, exam:"JEE",  topic:"Maths",      text:"The number of solutions of sin x = x/10 is:", options:["1","3","5","7"], correct:3, explanation:"The line y=x/10 intersects y=sinx at 7 points (including origin), giving 7 solutions in the range where both functions are defined." },
  { id:12, year:2023, exam:"JEE",  topic:"Physics",    text:"The dimension of (ε₀) permittivity of free space is:", options:["M⁻¹L⁻³T⁴A²","M⁻¹L³T⁴A²","ML³T⁴A²","M⁻¹L⁻³T⁻⁴A²"], correct:0, explanation:"From Coulomb's law, ε₀ = q²/(F·r²), giving dimensions [M⁻¹L⁻³T⁴A²]." },
  { id:13, year:2022, exam:"JEE",  topic:"Chemistry",  text:"Which of the following is NOT a colligative property?", options:["Elevation of boiling point","Depression of freezing point","Osmotic pressure","Optical activity"], correct:3, explanation:"Colligative properties depend only on number of solute particles. Optical activity depends on the nature (structure) of the solute, not its amount." },
  { id:14, year:2022, exam:"JEE",  topic:"Maths",      text:"∫₀¹ x/(1+x²) dx = ?", options:["ln2/2","ln2","½","1"], correct:0, explanation:"Let u=1+x², du=2x dx. Integral becomes ½∫₁² du/u = ½[ln u]₁² = ½(ln2-ln1) = (ln2)/2." },
  { id:15, year:2024, exam:"NEET", topic:"Biology",    text:"Which enzyme is responsible for the unwinding of DNA double helix during replication?", options:["DNA Polymerase","Helicase","Ligase","Primase"], correct:1, explanation:"Helicase breaks the hydrogen bonds between base pairs and unwinds the double helix to expose single-stranded templates for replication." },
  { id:16, year:2024, exam:"NEET", topic:"Chemistry",  text:"The IUPAC name of CH₃-CHO is:", options:["Methanal","Ethanal","Propanal","Ethanone"], correct:1, explanation:"CH₃-CHO has 2 carbons with an aldehyde group. IUPAC name: Ethanal (eth=2C, al=aldehyde)." },
  { id:17, year:2023, exam:"NEET", topic:"Biology",    text:"The process by which RNA is synthesized from a DNA template is called:", options:["Translation","Replication","Transcription","Transduction"], correct:2, explanation:"Transcription is the process of synthesizing RNA from a DNA template, catalyzed by RNA polymerase in the nucleus." },
  { id:18, year:2023, exam:"NEET", topic:"Physics",    text:"Which of the following has zero resistance at absolute zero temperature?", options:["Conductor","Semiconductor","Superconductor","Insulator"], correct:2, explanation:"Superconductors exhibit zero electrical resistance below a critical temperature (Tc), which for most materials is near absolute zero." },
  { id:19, year:2023, exam:"SSC",  topic:"Reasoning",  text:"In a certain code, 'COMPUTER' is written as 'RFUVQNPC'. How is 'MEDICINE' written in that code?", options:["MFEJDJOF","EOJDJEFM","MFEJDJFO","EDJDJOFM"], correct:0, explanation:"Each letter is shifted by +1 in the alphabet. M+1=N becomes the pattern for encoding MEDICINE." },
  { id:20, year:2023, exam:"SSC",  topic:"GK",         text:"Who became the first woman to win the Nobel Prize in Physics?", options:["Rosalind Franklin","Marie Curie","Lise Meitner","Chien-Shiung Wu"], correct:1, explanation:"Marie Curie won the Nobel Prize in Physics in 1903 (shared with Henri Becquerel and Pierre Curie) for research on radiation." },
  { id:21, year:2022, exam:"SSC",  topic:"Quant",      text:"A shopkeeper gives 25% discount on marked price and still gains 20%. If cost price is ₹2400, what is marked price?", options:["₹3600","₹3840","₹4000","₹4200"], correct:1, explanation:"SP = 2400×1.2 = ₹2880. SP = MP×0.75, so MP = 2880/0.75 = ₹3840." },
  { id:22, year:2022, exam:"SSC",  topic:"English",    text:"Choose the word closest in meaning to 'EPHEMERAL':", options:["Permanent","Transient","Essential","Ancient"], correct:1, explanation:"'Ephemeral' means lasting for a very short time. 'Transient' is the closest synonym, meaning temporary or short-lived." },
];

// Static theme-token style map — driven entirely by the shared --theme-* CSS
// variables set on <html data-theme="dark|light">, so this page always mirrors
// the dashboard toggle exactly with zero extra JS/state.
const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  headerBg: "var(--theme-card-bg)",
  headerBorder: "var(--theme-border)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
  subText: "var(--theme-text-sub)",
  inputBg: "var(--theme-card-bg)",
  inputBorder: "1px solid var(--theme-border)",
  inputColor: "var(--theme-text-main)",
  optBg: "var(--theme-bg-main)",
  optBorder: "1px solid var(--theme-border)",
  optColor: "var(--theme-text-main)",
  badgeBg: "var(--theme-bg-main)",
  badgeBorder: "1px solid var(--theme-border)",
  inactiveBtnBg: "var(--theme-card-bg)",
  inactiveBtnBorder: "1px solid var(--theme-border)",
  inactiveBtnColor: "var(--theme-text-sub)",
  neutralCircleBg: "var(--theme-hover-bg)",
};

export default function PYQsPage() {
  const [examFilter, setExamFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All Years");
  const [topicFilter, setTopicFilter] = useState("All Topics");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const topics = TOPICS[examFilter] || TOPICS["All"];

  const filtered = useMemo(() => {
    return PYQS.filter(q => {
      const mExam  = examFilter === "All"       || q.exam === examFilter;
      const mYear  = yearFilter === "All Years" || q.year === parseInt(yearFilter);
      const mTopic = topicFilter === "All Topics" || q.topic === topicFilter;
      const mSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
      return mExam && mYear && mTopic && mSearch;
    });
  }, [examFilter, yearFilter, topicFilter, search]);

  const handleAnswer = (qId: number, optIdx: number) => {
    setAnswered(prev => ({ ...prev, [qId]: optIdx }));
  };

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PYQS.forEach(q => {
      if (examFilter === "All" || q.exam === examFilter) {
        counts[q.year] = (counts[q.year] || 0) + 1;
      }
    });
    return counts;
  }, [examFilter]);

  const correctCount = Object.entries(answered).filter(([id, ans]) => {
    const q = PYQS.find(q => q.id === parseInt(id));
    return q && q.correct === ans;
  }).length;

  return (
    <div style={{ minHeight:"100vh", background: themeStyles.bg, color: themeStyles.color, fontFamily:"'DM Sans',sans-serif", overflowX:"hidden", transition: "background 0.3s, color 0.3s" }}>

      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:50, background: themeStyles.headerBg, backdropFilter:"blur(20px)", borderBottom:`1px solid ${themeStyles.headerBorder}`, padding:"14px 20px" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:"9px", textDecoration:"none" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:G.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", fontWeight:"bold" }}>⚡</div>
              <span style={{ fontWeight:800, fontSize:"1.2rem", color: themeStyles.color }}>Mentor<span style={{ color:"var(--theme-accent)" }}>a</span></span>
            </a>
            <BackToDashboardLink inline />
          </div>

          {Object.keys(answered).length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", background: "rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:"100px", padding:"4px 12px" }}>
                <span style={{ color:"#22C55E", fontWeight:700, fontFamily:"monospace", fontSize:"0.85rem" }}>{correctCount}/{Object.keys(answered).length}</span>
                <span style={{ color: themeStyles.subText, fontSize:"0.78rem" }}>correct</span>
              </div>
              <div style={{ fontSize:"0.78rem", color: themeStyles.subText }}>
                Accuracy: <strong style={{ color: correctCount/Object.keys(answered).length >= 0.7 ? "#22C55E" : "var(--theme-accent)" }}>{Object.keys(answered).length > 0 ? Math.round(correctCount/Object.keys(answered).length*100) : 0}%</strong>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="main-container" style={{ maxWidth:"1280px", margin:"0 auto", padding:"36px 32px 60px", boxSizing: "border-box" }}>

        {/* Title and View Mode */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"16px", marginBottom:"28px" }}>
          <div>
            <h1 style={{ fontSize:"clamp(1.5rem, 4vw, 1.9rem)", fontWeight:800, letterSpacing:"-0.025em", marginBottom:"6px", color: themeStyles.color }}>Previous Year Questions</h1>
            <p style={{ color: themeStyles.subText, fontSize:"0.9rem" }}>{PYQS.length}+ PYQs from UPSC, JEE, NEET & SSC — with detailed explanations.</p>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={() => setViewMode("grid")} style={{ padding:"8px 16px", borderRadius:"8px", border:"none", background: viewMode==="grid" ? G.grad : themeStyles.inactiveBtnBg, color: viewMode==="grid" ? "var(--theme-accent-text)" : themeStyles.inactiveBtnColor, fontWeight:600, fontSize:"0.8rem", cursor:"pointer", boxShadow: viewMode!=="grid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>⊞ Grid</button>
            <button onClick={() => setViewMode("list")} style={{ padding:"8px 16px", borderRadius:"8px", border: viewMode==="list" ? "none" : themeStyles.inactiveBtnBorder, background: viewMode==="list" ? G.grad : themeStyles.inactiveBtnBg, color: viewMode==="list" ? "var(--theme-accent-text)" : themeStyles.inactiveBtnColor, fontWeight:600, fontSize:"0.8rem", cursor:"pointer", boxShadow: viewMode!=="list" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>≡ List</button>
          </div>
        </div>

        {/* Years Scrollable Filter */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px", overflowX:"auto", paddingBottom:"6px", scrollbarWidth:"none" }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => setYearFilter(y)} style={{
              padding:"7px 16px", borderRadius:"10px", fontSize:"0.8rem", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
              border: yearFilter===y ? "none" : themeStyles.inactiveBtnBorder,
              background: yearFilter===y ? G.grad : themeStyles.inactiveBtnBg,
              color: yearFilter===y ? "var(--theme-accent-text)" : themeStyles.inactiveBtnColor,
              transition:"all 0.18s",
              boxShadow: yearFilter!==y ? "0 1px 2px rgba(0,0,0,0.04)" : "none"
            }}>
              {y} {y !== "All Years" && yearCounts[y] ? <span style={{ opacity:0.7 }}>({yearCounts[y]})</span> : ""}
            </button>
          ))}
        </div>

        {/* Exams Filter */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
          {EXAMS.map(e => (
            <button key={e} onClick={() => { setExamFilter(e); setTopicFilter("All Topics"); }} style={{
              display:"flex", alignItems:"center", gap:"7px",
              padding:"9px 18px", borderRadius:"12px", fontSize:"0.85rem", fontWeight:600, cursor:"pointer",
              border: examFilter===e ? "none" : themeStyles.inactiveBtnBorder,
              background: examFilter===e ? G.grad : themeStyles.inactiveBtnBg,
              color: examFilter===e ? "var(--theme-accent-text)" : themeStyles.inactiveBtnColor,
              transition:"all 0.2s",
              boxShadow: examFilter!==e ? "0 1px 2px rgba(0,0,0,0.04)" : "none"
            }}>
              {e==="UPSC" ? "🏛️" : e==="JEE" ? "⚗️" : e==="NEET" ? "🔬" : e==="SSC" ? "📋" : "📚"} {e}
            </button>
          ))}
        </div>

        {/* Topics & Search Bar Container */}
        <div style={{ display:"flex", gap:"12px", marginBottom:"24px", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", flex:1, minWidth:"280px" }}>
            {topics.map(t => (
              <button key={t} onClick={() => setTopicFilter(t)} style={{
                padding:"6px 14px", borderRadius:"8px", fontSize:"0.78rem", fontWeight:500, cursor:"pointer",
                border: topicFilter===t ? "1px solid var(--theme-accent-border)" : themeStyles.inactiveBtnBorder,
                background: topicFilter===t ? "var(--theme-accent-soft)" : themeStyles.inactiveBtnBg,
                color: topicFilter===t ? "var(--theme-accent)" : themeStyles.inactiveBtnColor,
                transition:"all 0.18s",
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", background: themeStyles.inputBg, border: themeStyles.inputBorder, borderRadius:"12px", padding:"10px 14px", width:"100%", maxWidth:"300px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", boxSizing: "border-box" }}>
            <span style={{ color: themeStyles.subText }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." style={{ flex:1, background:"none", border:"none", outline:"none", color: themeStyles.inputColor, fontSize:"0.875rem", fontFamily:"'DM Sans',sans-serif", width:"100%" }} />
          </div>
        </div>

        <p style={{ fontSize:"0.82rem", color: themeStyles.subText, marginBottom:"16px" }}>
          <strong style={{ color: themeStyles.color }}>{filtered.length}</strong> question{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Questions Grid/List */}
        {filtered.length > 0 ? (
          <div className="pyq-grid-container" style={{ display:"grid", gridTemplateColumns: viewMode==="grid" ? "repeat(2,1fr)" : "1fr", gap:"16px" }}>
            {filtered.map(q => {
              const userAns = answered[q.id];
              const hasAnswered = userAns !== undefined;
              const isCorrect = hasAnswered && userAns === q.correct;
              const isExpanded = expanded === q.id;

              return (
                <div key={q.id} style={{ 
                  background: themeStyles.cardBg, 
                  border: hasAnswered ? `1px solid ${isCorrect ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}` : themeStyles.cardBorder, 
                  borderRadius: "16px",
                  padding:"22px", 
                  transition:"all 0.22s",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)",
                  boxSizing: "border-box"
                }}>

                  {/* Tags */}
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.62rem", fontWeight:700, color:"var(--theme-accent)", background:"var(--theme-accent-soft)", border:"1px solid var(--theme-accent-border)", borderRadius:"100px", padding:"2px 8px" }}>{q.exam}</span>
                    <span style={{ fontSize:"0.62rem", fontWeight:600, color: themeStyles.subText, background: themeStyles.badgeBg, border: themeStyles.badgeBorder, borderRadius:"100px", padding:"2px 8px" }}>{q.topic}</span>
                    <span style={{ fontSize:"0.62rem", fontWeight:600, color:"#818CF8", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:"100px", padding:"2px 8px" }}>{q.year}</span>
                    {hasAnswered && (
                      <span style={{ fontSize:"0.62rem", fontWeight:700, color: isCorrect ? "#22C55E" : "#EF4444", background: isCorrect ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${isCorrect ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius:"100px", padding:"2px 8px", marginLeft:"auto" }}>
                        {isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <p style={{ fontSize:"0.9rem", fontWeight:500, color: themeStyles.color, lineHeight:1.65, marginBottom:"18px" }}>{q.text}</p>

                  {/* Options */}
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
                    {q.options.map((opt, i) => {
                      const isSelected = userAns === i;
                      const isCorrectOpt = i === q.correct;
                      let bg = themeStyles.optBg, border = themeStyles.optBorder, color = themeStyles.optColor;

                      if (hasAnswered) {
                        if (isCorrectOpt) { bg = "rgba(34,197,94,0.1)"; border = "1px solid rgba(34,197,94,0.4)"; color = "#22C55E"; }
                        else if (isSelected && !isCorrectOpt) { bg = "rgba(239,68,68,0.1)"; border = "1px solid rgba(239,68,68,0.4)"; color = "#EF4444"; }
                      } else if (isSelected) {
                        bg = "var(--theme-accent-soft)"; border = "1.5px solid var(--theme-accent)"; color = themeStyles.color;
                      }

                      return (
                        <button key={i} onClick={() => !hasAnswered && handleAnswer(q.id, i)} style={{
                          display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", textAlign:"left", width:"100%",
                          borderRadius:"10px", cursor: hasAnswered ? "default" : "pointer",
                          fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem",
                          background:bg, border, color, transition:"all 0.18s",
                          boxSizing: "border-box"
                        }}>
                          <div style={{ width:"22px", height:"22px", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700,
                            background: hasAnswered && isCorrectOpt ? "#22C55E" : hasAnswered && isSelected ? "#EF4444" : isSelected ? G.grad : themeStyles.neutralCircleBg,
                            color: (hasAnswered && (isCorrectOpt || isSelected)) || isSelected ? (hasAnswered && isCorrectOpt ? "var(--theme-accent-text)" : "#fff") : themeStyles.subText,
                          }}>{String.fromCharCode(65+i)}</div>
                          <span style={{ flex:1, wordBreak:"break-word" }}>{opt}</span>
                          {hasAnswered && isCorrectOpt && <span style={{ marginLeft:"auto", fontSize:"0.75rem" }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {hasAnswered && (
                    <div>
                      <button onClick={() => setExpanded(isExpanded ? null : q.id)} style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", color:"var(--theme-accent)", fontSize:"0.8rem", fontWeight:600, cursor:"pointer", padding:0, marginBottom: isExpanded ? "10px" : 0 }}>
                        💡 {isExpanded ? "Hide" : "Show"} Explanation
                      </button>
                      {isExpanded && (
                        <div style={{ background: "var(--theme-accent-soft)", border: "1px solid var(--theme-accent-border)", borderRadius:"10px", padding:"14px", fontSize:"0.82rem", color: themeStyles.color, lineHeight:1.7, marginTop:"10px" }}>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontSize:"3rem", marginBottom:"16px" }}>🔍</div>
            <h3 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"8px", color: themeStyles.color }}>No questions found</h3>
            <p style={{ color: themeStyles.subText, fontSize:"0.875rem" }}>Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Global CSS for full mobile responsiveness */}
      <style>{`
        @media(max-width:900px){
          .pyq-grid-container {
            grid-template-columns: 1fr !important;
          }
        }
        @media(max-width:600px){
          .main-container {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}