"use client";

import { useEffect, useMemo, useState } from "react";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import notesService from "@/services/notesService";
import { settingsService } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

const EXAMS = [
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "ssc", label: "SSC" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
];

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  upsc: ["Polity", "History", "Geography", "Economy", "Environment", "CSAT"],
  jee: ["Physics", "Chemistry", "Maths"],
  neet: ["Biology", "Physics", "Chemistry"],
  ssc: ["Reasoning", "Quant", "English", "GK"],
};

// My Notes (src/app/my-notes/page.tsx) only has filter tabs for this fixed
// set of subjects. A few subjects this generator supports (Environment,
// CSAT, Reasoning, Quant, GK, ...) aren't in that list, so a note saved
// under one of those would only ever show up in My Notes' "All" tab and
// never its own subject tab. Map anything My Notes doesn't recognize to
// "Other" at save time so every saved note is filterable there — this only
// affects what's stored as the note's subject, not the dropdown/prompt
// above, so exam-specific subjects like "Reasoning" still generate exactly
// as before.
const MY_NOTES_SUBJECTS = new Set([
  "UPSC", "JEE", "NEET", "SSC", "Polity", "History", "Geography",
  "Economy", "Physics", "Chemistry", "Biology", "Maths", "Other",
]);
function mapSubjectForMyNotes(subject: string): string {
  return MY_NOTES_SUBJECTS.has(subject) ? subject : "Other";
}

export default function NotesGeneratorPage() {
  const [exam, setExam] = useState("upsc");
  const [subject, setSubject] = useState(SUBJECTS_BY_EXAM["upsc"][0]);
  const [language, setLanguage] = useState("english");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const subjectOptions = useMemo(() => SUBJECTS_BY_EXAM[exam] ?? [], [exam]);

  // Default the Language dropdown to the user's "Content Language" choice
  // from Settings → Language & Region, which documents this page as one of
  // the features it controls. Loaded once on mount; the user can still
  // change it per-generation via the dropdown below.
  useEffect(() => {
    settingsService
      .getSettings()
      .then((settings) => {
        setLanguage(settings.language_region.contentLanguage.toLowerCase());
      })
      .catch(() => {
        // Not fatal — the generator still works with the "English" default.
      });
  }, []);

  function handleExamChange(value: string) {
    setExam(value);
    setSubject(SUBJECTS_BY_EXAM[value]?.[0] ?? "");
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotes("");
    setSaved(false);

    try {
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, subject, topic, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not generate notes.");
      }

      setNotes(data.notes);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToMyNotes() {
    if (!notes || saving || saved) return;
    setSaving(true);
    setError(null);
    try {
      await notesService.createNote({
        title: topic,
        content: notes,
        subject: mapSubjectForMyNotes(subject),
        tags: [EXAMS.find((e) => e.value === exam)?.label ?? exam, subject],
        color: "#F59E0B",
      });
      setSaved(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not save the note."));
    } finally {
      setSaving(false);
    }
  }

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    cardBg: "var(--theme-card-bg, #0B1220)",
    cardBorder: "1px solid var(--theme-border, rgba(255,255,255,.06))",
    inputBg: "var(--theme-hover-bg, #0F172A)",
    inputBorder: "1px solid var(--theme-border, rgba(255,255,255,.08))",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    background: themeStyles.inputBg,
    border: themeStyles.inputBorder,
    borderRadius: "10px",
    padding: "11px 14px",
    color: themeStyles.color,
    fontSize: ".9rem",
    outline: "none",
    transition: "background 0.3s, color 0.3s, border 0.3s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: themeStyles.subText,
    fontSize: ".78rem",
    fontWeight: 600,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: ".03em",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans',sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            Notes <span style={G.gradText}>Generator</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Exam, subject aur topic chuno — AI step-by-step notes bana dega.
          </p>
        </header>

        <div style={{ ...cardStyle, padding: "clamp(16px, 3vw, 22px)", marginBottom: "20px" }}>
          <div
            className="notes-exam-subject-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label style={labelStyle}>Exam</label>
              <select
                value={exam}
                onChange={(e) => handleExamChange(e.target.value)}
                style={selectStyle}
              >
                {EXAMS.map((e) => (
                  <option key={e.value} value={e.value} style={{ background: themeStyles.cardBg, color: themeStyles.color }}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={selectStyle}
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s} style={{ background: themeStyles.cardBg, color: themeStyles.color }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={selectStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} style={{ background: themeStyles.cardBg, color: themeStyles.color }}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Laws of Motion, French Revolution..."
              style={selectStyle}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "var(--theme-accent-text, #111827)",
              padding: "13px",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: ".95rem",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>
              {error}
            </p>
          )}
        </div>

        {notes && (
          <div style={{ ...cardStyle, padding: "clamp(20px, 4vw, 26px)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
              <button
                onClick={handleSaveToMyNotes}
                disabled={saving || saved}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: saved ? "rgba(34,197,94,0.12)" : "var(--theme-accent-soft, rgba(245,158,11,0.1))",
                  color: saved ? "#22C55E" : "var(--theme-accent, #F59E0B)",
                  fontSize: ".8rem",
                  fontWeight: 700,
                  cursor: saving || saved ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saved ? "✓ Saved to My Notes" : saving ? "Saving..." : "💾 Save to My Notes"}
              </button>
            </div>
            {renderMarkdownLite(notes)}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:600px){.notes-exam-subject-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}