"use client";
import { useState, useEffect } from "react";
import { gradAmberOrange, gradTextAmberOrange } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import notesService, { Note } from "@/services/notesService";
import { settingsService } from "@/services/settingsService";
import { formatDate, type DateFormat } from "@/lib/dateFormat";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmberOrange, gradText: gradTextAmberOrange };

const SUBJECTS = ["All", "UPSC", "JEE", "NEET", "SSC", "Polity", "History", "Geography", "Economy", "Physics", "Chemistry", "Biology", "Maths", "Other"];
const NOTE_COLORS = ["#6366F1", "#F59E0B", "#22C55E", "#EF4444", "#06B6D4", "#8B5CF6", "#F97316", "#EC4899"];

export default function NotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");

  // Form state
  const [fTitle,   setFTitle]   = useState("");
  const [fContent, setFContent] = useState("");
  const [fSubject, setFSubject] = useState("UPSC");
  const [fTags,    setFTags]    = useState("");
  const [fColor,   setFColor]   = useState(NOTE_COLORS[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await notesService.getAllNotes();
        if (!cancelled) setNotes(data);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load notes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((settings) => {
        setDateFormat(settings.language_region.dateFormat as DateFormat);
      })
      .catch(() => {
        // Not fatal — this page still works with the default format.
      });
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

  const saveNote = async () => {
    if (!fTitle.trim() || saving) return;
    const tags = fTags.split(",").map(t => t.trim()).filter(Boolean);
    const input = { title: fTitle, content: fContent, subject: fSubject, tags, color: fColor };
    try {
      setSaving(true);
      if (editing) {
        const updated = await notesService.updateNote(editing.id, input);
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      } else {
        const created = await notesService.createNote(input);
        setNotes(prev => [created, ...prev]);
      }
      setShowAdd(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save note"));
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    const prevNotes = notes;
    setNotes(notes.filter(n => n.id !== id));
    setViewNote(null);
    try {
      await notesService.deleteNote(id);
    } catch (err: unknown) {
      setNotes(prevNotes); // revert on failure
      setError(getErrorMessage(err, "Failed to delete note"));
    }
  };

  const togglePin = async (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
    setNotes(notes.map(n => n.id === id ? { ...n, pinned: nextPinned } : n));
    try {
      await notesService.togglePin(id, nextPinned);
    } catch (err: unknown) {
      setNotes(notes.map(n => n.id === id ? { ...n, pinned: !nextPinned } : n)); // revert on failure
      setError(getErrorMessage(err, "Failed to update note"));
    }
  };

  const filtered = notes
    .filter(n => subjectFilter === "All" || n.subject === subjectFilter)
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    mutedText: "var(--theme-muted-text, #64748B)",
    cardBg: "var(--theme-card-bg, #111827)",
    cardBorder: "1px solid var(--theme-border, rgba(255,255,255,0.07))",
    inputBg: "var(--theme-hover-bg, #0D1220)",
    inputBorder: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
    headerBg: "var(--theme-card-bg, rgba(8,12,20,0.92))",
    modalBg: "var(--theme-card-bg, #111827)",
    tagBg: "var(--theme-hover-bg, #0D1220)",
    tagColor: "var(--theme-text-sub, #64748B)",
    contentPreview: "var(--theme-text-sub, #64748B)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: themeStyles.inputBg,
    border: themeStyles.inputBorder,
    borderRadius: "10px",
    color: themeStyles.color,
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box",
    transition: "background 0.3s, color 0.3s, border 0.3s",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
  };

  const fmtDate = (s: string) => formatDate(s, dateFormat);

  return (
    <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.color, fontFamily: "'DM Sans',sans-serif", transition: "background 0.3s, color 0.3s" }}>

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: themeStyles.headerBg, backdropFilter: "blur(20px)", borderBottom: themeStyles.cardBorder, padding: "16px clamp(16px, 4vw, 32px)", transition: "background 0.3s, border 0.3s" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold", color: "var(--theme-accent-text, #080C14)" }}>⚡</div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", color: themeStyles.color }}>Mentor<span style={{ color: "var(--theme-accent, #F59E0B)" }}>a</span></span>
            </a>
            <BackToDashboardLink inline />
          </div>
          <button onClick={openAdd} style={{ padding: "9px 20px", borderRadius: "10px", background: G.grad, border: "none", color: "var(--theme-accent-text, #080C14)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            + New Note
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) 60px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "6px", color: themeStyles.color }}>My Notes</h1>
          <p style={{ color: themeStyles.subText, fontSize: "0.9rem" }}>{notes.length} notes — write, organise and revise anytime.</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: themeStyles.cardBg, border: themeStyles.cardBorder, borderRadius: "12px", padding: "10px 14px", flex: 1, minWidth: "200px", transition: "background 0.3s, border 0.3s" }}>
            <span style={{ color: themeStyles.subText }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: themeStyles.color, fontSize: "0.875rem", fontFamily: "'DM Sans',sans-serif" }} />
          </div>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", gap: "7px", marginBottom: "24px", flexWrap: "wrap" }}>
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSubjectFilter(s)} style={{
              padding: "6px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
              border: subjectFilter === s ? "none" : themeStyles.cardBorder,
              background: subjectFilter === s ? G.grad : "transparent",
              color: subjectFilter === s ? "var(--theme-accent-text, #080C14)" : themeStyles.subText, transition: "all 0.18s",
            }}>{s}</button>
          ))}
        </div>

        <p style={{ fontSize: "0.82rem", color: themeStyles.subText, marginBottom: "16px" }}>
          <strong style={{ color: themeStyles.color }}>{filtered.length}</strong> note{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📓</p>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px", color: themeStyles.color }}>No notes found</h3>
            <p style={{ color: themeStyles.subText, fontSize: "0.875rem", marginBottom: "20px" }}>Create your first note to get started!</p>
            <button onClick={openAdd} style={{ padding: "12px 24px", borderRadius: "12px", background: G.grad, border: "none", color: "var(--theme-accent-text, #080C14)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Create Note</button>
          </div>
        ) : (
          <div className="my-notes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
            {filtered.map(note => (
              <div key={note.id} onClick={() => setViewNote(note)} style={{ ...cardStyle, padding: "0", overflow: "hidden", cursor: "pointer", transition: "all 0.22s", position: "relative" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.borderColor = `${note.color}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px rgba(0,0,0,0.15)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border, rgba(255,255,255,0.07))"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                {/* Color bar top */}
                <div style={{ height: "4px", background: note.color }} />
                <div style={{ padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 700, color: themeStyles.color, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{note.title}</p>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: note.color, background: `${note.color}20`, borderRadius: "100px", padding: "2px 8px" }}>{note.subject}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginLeft: "8px", flexShrink: 0 }}>
                      {note.pinned && <span title="Pinned" style={{ fontSize: "0.8rem" }}>📌</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: themeStyles.contentPreview, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "12px" }}>
                    {note.content}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {note.tags.slice(0, 2).map(t => (
                        <span key={t} style={{ fontSize: "0.6rem", color: themeStyles.tagColor, background: themeStyles.tagBg, border: themeStyles.cardBorder, borderRadius: "100px", padding: "1px 7px" }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.65rem", color: themeStyles.mutedText }}>{fmtDate(note.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Note Modal */}
      {viewNote && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: themeStyles.modalBg, border: themeStyles.cardBorder, borderRadius: "20px", maxWidth: "600px", width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "5px", background: viewNote.color }} />
            <div style={{ padding: "24px 28px", borderBottom: themeStyles.cardBorder, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: themeStyles.color }}>{viewNote.title}</h2>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: viewNote.color, background: `${viewNote.color}20`, borderRadius: "100px", padding: "2px 8px" }}>{viewNote.subject}</span>
                  {viewNote.tags.map(t => <span key={t} style={{ fontSize: "0.65rem", color: themeStyles.tagColor, background: themeStyles.tagBg, border: themeStyles.cardBorder, borderRadius: "100px", padding: "2px 7px" }}>{t}</span>)}
                </div>
              </div>
              <button onClick={() => setViewNote(null)} style={{ background: "none", border: "none", color: themeStyles.subText, cursor: "pointer", fontSize: "1.2rem", padding: "4px", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              <pre style={{ fontSize: "0.9rem", color: themeStyles.contentPreview, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: "'DM Sans',sans-serif", margin: 0 }}>{viewNote.content}</pre>
            </div>
            <div style={{ padding: "16px 28px", borderTop: themeStyles.cardBorder, display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: themeStyles.mutedText }}>Updated {fmtDate(viewNote.updatedAt)}</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => togglePin(viewNote.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: themeStyles.cardBorder, background: "transparent", color: viewNote.pinned ? "var(--theme-accent, #F59E0B)" : themeStyles.subText, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  {viewNote.pinned ? "📌 Unpin" : "📌 Pin"}
                </button>
                <button onClick={() => openEdit(viewNote)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "var(--theme-accent-soft, rgba(245,158,11,0.1))", color: "var(--theme-accent, #F59E0B)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                <button onClick={() => deleteNote(viewNote.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: themeStyles.modalBg, border: themeStyles.cardBorder, borderRadius: "20px", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: themeStyles.cardBorder }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: themeStyles.color }}>{editing ? "Edit Note" : "New Note"}</h3>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: themeStyles.color, marginBottom: "6px" }}>Title</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Note title..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: themeStyles.color, marginBottom: "6px" }}>Content</label>
                <textarea value={fContent} onChange={e => setFContent(e.target.value)} placeholder="Write your notes here..." rows={8}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }} />
              </div>
              <div className="my-notes-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: themeStyles.color, marginBottom: "6px" }}>Subject</label>
                  <select value={fSubject} onChange={e => setFSubject(e.target.value)} style={inputStyle}>
                    {SUBJECTS.filter(s => s !== "All").map(s => <option key={s} value={s} style={{ background: themeStyles.modalBg, color: themeStyles.color }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: themeStyles.color, marginBottom: "6px" }}>Tags (comma separated)</label>
                  <input value={fTags} onChange={e => setFTags(e.target.value)} placeholder="UPSC, Prelims, ..." style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: themeStyles.color, marginBottom: "8px" }}>Color</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {NOTE_COLORS.map(c => (
                    <div key={c} onClick={() => setFColor(c)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, cursor: "pointer", border: fColor === c ? `3px solid ${themeStyles.color}` : "3px solid transparent", transition: "all 0.15s" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: themeStyles.cardBorder, display: "flex", gap: "10px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: themeStyles.cardBorder, background: "transparent", color: themeStyles.color, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveNote} disabled={!fTitle.trim()} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: fTitle.trim() ? G.grad : "var(--theme-hover-bg, #1A2640)", color: fTitle.trim() ? "var(--theme-accent-text, #080C14)" : themeStyles.mutedText, fontWeight: 700, fontSize: "0.85rem", cursor: fTitle.trim() ? "pointer" : "not-allowed" }}>
                {editing ? "Save Changes" : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){.my-notes-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){.my-notes-grid{grid-template-columns:1fr!important}.my-notes-form-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}