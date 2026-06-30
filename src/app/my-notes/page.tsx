"use client";
import { useState, useEffect } from "react";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" },
};

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  color: string;
  pinned: boolean;
};

const SUBJECTS = ["All", "UPSC", "JEE", "NEET", "SSC", "Polity", "History", "Geography", "Economy", "Physics", "Chemistry", "Biology", "Maths", "Other"];
const NOTE_COLORS = ["#6366F1", "#F59E0B", "#22C55E", "#EF4444", "#06B6D4", "#8B5CF6", "#F97316", "#EC4899"];

const NOTES_KEY = "mentora_notes";
function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); } catch { return []; }
}
function saveNotes(notes: Note[]) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch { }
}

const SAMPLE_NOTES: Note[] = [
  { id: "1", title: "Fundamental Rights — Key Points", subject: "Polity", content: "Articles 12-35 deal with Fundamental Rights.\n\n• Art 14: Right to Equality\n• Art 19: Six Freedoms (speech, assembly, movement, profession, etc.)\n• Art 21: Right to Life & Personal Liberty\n• Art 32: Right to Constitutional Remedies (Heart of Constitution — Ambedkar)\n\nNote: Art 19(1)(f) — Right to Property removed by 44th Amendment 1978.", tags: ["UPSC", "Polity", "Prelims"], createdAt: "2025-01-15T10:00:00Z", updatedAt: "2025-01-15T10:00:00Z", color: "#6366F1", pinned: true },
  { id: "2", title: "Thermodynamics Laws", subject: "Physics", content: "0th Law: Thermal equilibrium (basis of temperature)\n\n1st Law: Energy conservation ΔU = Q - W\n\n2nd Law: Entropy always increases (heat flows hot→cold)\n\n3rd Law: Entropy → 0 as T → 0K\n\nKeyword: Zero First Second Third = 0 1 2 3", tags: ["JEE", "Physics", "Thermodynamics"], createdAt: "2025-01-20T09:00:00Z", updatedAt: "2025-01-20T09:00:00Z", color: "#F59E0B", pinned: false },
  { id: "3", title: "Cell Division — Mitosis vs Meiosis", subject: "Biology", content: "MITOSIS:\n• 2 daughter cells, same chromosome number\n• Somatic cells\n• Purpose: Growth & repair\n• Phases: PMAT (Prophase, Metaphase, Anaphase, Telophase)\n\nMEIOSIS:\n• 4 daughter cells, half chromosome number\n• Reproductive cells (gametes)\n• Purpose: Sexual reproduction\n• Genetic variation through crossing over", tags: ["NEET", "Biology", "Cell"], createdAt: "2025-02-01T11:00:00Z", updatedAt: "2025-02-01T11:00:00Z", color: "#22C55E", pinned: false },
];

export default function NotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [search, setSearch]     = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);

  // Form state
  const [fTitle,   setFTitle]   = useState("");
  const [fContent, setFContent] = useState("");
  const [fSubject, setFSubject] = useState("UPSC");
  const [fTags,    setFTags]    = useState("");
  const [fColor,   setFColor]   = useState(NOTE_COLORS[0]);

  useEffect(() => {
    const stored = loadNotes();
    setNotes(stored.length > 0 ? stored : SAMPLE_NOTES);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFTitle(""); setFContent(""); setFSubject("UPSC"); setFTags(""); setFColor(NOTE_COLORS[0]);
    setShowAdd(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setFTitle(note.title); setFContent(note.content); setFSubject(note.subject);
    setFTags(note.tags.join(", ")); setFColor(note.color);
    setShowAdd(true); setViewNote(null);
  };

  const saveNote = () => {
    if (!fTitle.trim()) return;
    const now = new Date().toISOString();
    const tags = fTags.split(",").map(t => t.trim()).filter(Boolean);
    if (editing) {
      const updated = notes.map(n => n.id === editing.id ? { ...n, title:fTitle, content:fContent, subject:fSubject, tags, color:fColor, updatedAt:now } : n);
      setNotes(updated); saveNotes(updated);
    } else {
      const newNote: Note = { id: Date.now().toString(), title:fTitle, content:fContent, subject:fSubject, tags, color:fColor, pinned:false, createdAt:now, updatedAt:now };
      const updated = [newNote, ...notes];
      setNotes(updated); saveNotes(updated);
    }
    setShowAdd(false);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated); saveNotes(updated); setViewNote(null);
  };

  const togglePin = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotes(updated); saveNotes(updated);
  };

  const filtered = notes
    .filter(n => subjectFilter === "All" || n.subject === subjectFilter)
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const inputStyle: React.CSSProperties = { width:"100%", padding:"10px 14px", background:"#0D1220", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", color:"white", fontSize:"0.875rem", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });

  return (
    <div style={{ minHeight:"100vh", background:"#080C14", color:"white", fontFamily:"'DM Sans',sans-serif" }}>

      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(8,12,20,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"16px 32px" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:"9px", textDecoration:"none" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:G.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", fontWeight:"bold" }}>⚡</div>
              <span style={{ fontWeight:800, fontSize:"1.2rem", color:"white" }}>Mentor<span style={{ color:"#F59E0B" }}>a</span></span>
            </a>
            <a href="/dashboard" style={{ fontSize:"0.85rem", color:"#64748B", textDecoration:"none" }}>← Dashboard</a>
          </div>
          <button onClick={openAdd} style={{ padding:"9px 20px", borderRadius:"10px", background:G.grad, border:"none", color:"#080C14", fontWeight:700, fontSize:"0.85rem", cursor:"pointer" }}>
            + New Note
          </button>
        </div>
      </header>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"32px 32px 60px" }}>
        <div style={{ marginBottom:"24px" }}>
          <h1 style={{ fontSize:"1.9rem", fontWeight:800, letterSpacing:"-0.025em", marginBottom:"6px" }}>My Notes</h1>
          <p style={{ color:"#64748B", fontSize:"0.9rem" }}>{notes.length} notes — write, organise and revise anytime.</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", background:"#111827", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"10px 14px", flex:1, minWidth:"200px" }}>
            <span style={{ color:"#64748B" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." style={{ flex:1, background:"none", border:"none", outline:"none", color:"white", fontSize:"0.875rem", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
        </div>

        {/* Subject tabs */}
        <div style={{ display:"flex", gap:"7px", marginBottom:"24px", flexWrap:"wrap" }}>
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSubjectFilter(s)} style={{
              padding:"6px 14px", borderRadius:"8px", fontSize:"0.78rem", fontWeight:500, cursor:"pointer",
              border: subjectFilter===s ? "none" : "1px solid rgba(255,255,255,0.07)",
              background: subjectFilter===s ? G.grad : "transparent",
              color: subjectFilter===s ? "#080C14" : "#64748B", transition:"all 0.18s",
            }}>{s}</button>
          ))}
        </div>

        <p style={{ fontSize:"0.82rem", color:"#64748B", marginBottom:"16px" }}>
          <strong style={{ color:"#CBD5E1" }}>{filtered.length}</strong> note{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <p style={{ fontSize:"3rem", marginBottom:"16px" }}>📓</p>
            <h3 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:"8px" }}>No notes found</h3>
            <p style={{ color:"#64748B", fontSize:"0.875rem", marginBottom:"20px" }}>Create your first note to get started!</p>
            <button onClick={openAdd} style={{ padding:"12px 24px", borderRadius:"12px", background:G.grad, border:"none", color:"#080C14", fontWeight:700, fontSize:"0.9rem", cursor:"pointer" }}>Create Note</button>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
            {filtered.map(note => (
              <div key={note.id} onClick={() => setViewNote(note)} style={{ ...G.card, padding:"0", overflow:"hidden", cursor:"pointer", transition:"all 0.22s", position:"relative" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${note.color}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px rgba(0,0,0,0.35)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                {/* Color bar top */}
                <div style={{ height:"4px", background:note.color }} />
                <div style={{ padding:"18px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"10px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:"0.95rem", fontWeight:700, color:"white", marginBottom:"4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{note.title}</p>
                      <span style={{ fontSize:"0.65rem", fontWeight:700, color:note.color, background:`${note.color}20`, borderRadius:"100px", padding:"2px 8px" }}>{note.subject}</span>
                    </div>
                    <div style={{ display:"flex", gap:"6px", marginLeft:"8px", flexShrink:0 }}>
                      {note.pinned && <span title="Pinned" style={{ fontSize:"0.8rem" }}>📌</span>}
                    </div>
                  </div>
                  <p style={{ fontSize:"0.82rem", color:"#64748B", lineHeight:1.55, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:"12px" }}>
                    {note.content}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                      {note.tags.slice(0,2).map(t => (
                        <span key={t} style={{ fontSize:"0.6rem", color:"#64748B", background:"#0D1220", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"100px", padding:"1px 7px" }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ fontSize:"0.65rem", color:"#475569" }}>{fmtDate(note.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Note Modal */}
      {viewNote && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
          <div style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", maxWidth:"600px", width:"100%", maxHeight:"85vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ height:"5px", background:viewNote.color }} />
            <div style={{ padding:"24px 28px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
              <div>
                <h2 style={{ fontSize:"1.2rem", fontWeight:800, letterSpacing:"-0.02em", marginBottom:"6px" }}>{viewNote.title}</h2>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, color:viewNote.color, background:`${viewNote.color}20`, borderRadius:"100px", padding:"2px 8px" }}>{viewNote.subject}</span>
                  {viewNote.tags.map(t => <span key={t} style={{ fontSize:"0.65rem", color:"#64748B", background:"#0D1220", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"100px", padding:"2px 7px" }}>{t}</span>)}
                </div>
              </div>
              <button onClick={() => setViewNote(null)} style={{ background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:"1.2rem", padding:"4px", flexShrink:0 }}>✕</button>
            </div>
            <div style={{ padding:"24px 28px", overflowY:"auto", flex:1 }}>
              <pre style={{ fontSize:"0.9rem", color:"#CBD5E1", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"'DM Sans',sans-serif", margin:0 }}>{viewNote.content}</pre>
            </div>
            <div style={{ padding:"16px 28px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"10px", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.72rem", color:"#475569" }}>Updated {fmtDate(viewNote.updatedAt)}</span>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={() => togglePin(viewNote.id)} style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color: viewNote.pinned ? "#F59E0B" : "#64748B", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>
                  {viewNote.pinned ? "📌 Unpin" : "📌 Pin"}
                </button>
                <button onClick={() => openEdit(viewNote)} style={{ padding:"8px 14px", borderRadius:"8px", border:"none", background:"rgba(245,158,11,0.1)", color:"#F59E0B", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>✏️ Edit</button>
                <button onClick={() => deleteNote(viewNote.id)} style={{ padding:"8px 14px", borderRadius:"8px", border:"none", background:"rgba(239,68,68,0.1)", color:"#EF4444", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
          <div style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", maxWidth:"560px", width:"100%", maxHeight:"90vh", overflow:"auto" }}>
            <div style={{ padding:"24px 28px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <h3 style={{ fontSize:"1.1rem", fontWeight:700 }}>{editing ? "Edit Note" : "New Note"}</h3>
            </div>
            <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#CBD5E1", marginBottom:"6px" }}>Title</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Note title..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#CBD5E1", marginBottom:"6px" }}>Content</label>
                <textarea value={fContent} onChange={e => setFContent(e.target.value)} placeholder="Write your notes here..." rows={8}
                  style={{ ...inputStyle, resize:"vertical", lineHeight:1.65 }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div>
                  <label style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#CBD5E1", marginBottom:"6px" }}>Subject</label>
                  <select value={fSubject} onChange={e => setFSubject(e.target.value)} style={inputStyle}>
                    {SUBJECTS.filter(s => s !== "All").map(s => <option key={s} value={s} style={{ background:"#111827" }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#CBD5E1", marginBottom:"6px" }}>Tags (comma separated)</label>
                  <input value={fTags} onChange={e => setFTags(e.target.value)} placeholder="UPSC, Prelims, ..." style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#CBD5E1", marginBottom:"8px" }}>Color</label>
                <div style={{ display:"flex", gap:"8px" }}>
                  {NOTE_COLORS.map(c => (
                    <div key={c} onClick={() => setFColor(c)} style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, cursor:"pointer", border: fColor===c ? "3px solid white" : "3px solid transparent", transition:"all 0.15s" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding:"16px 28px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"10px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"#CBD5E1", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>Cancel</button>
              <button onClick={saveNote} disabled={!fTitle.trim()} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background: fTitle.trim() ? G.grad : "#1A2640", color: fTitle.trim() ? "#080C14" : "#334155", fontWeight:700, fontSize:"0.85rem", cursor: fTitle.trim() ? "pointer" : "not-allowed" }}>
                {editing ? "Save Changes" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){div[style*="repeat(3,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}div[style*="padding: 32px 32px"]{padding:20px 16px!important}}
      `}</style>
    </div>
  );
}
