"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import BookToolsTabs, { BookToolMode } from "@/components/library/BookToolsTabs";
import LanguageToggle, { BookToolsLanguage } from "@/components/library/LanguageToggle";
import ReadAloud from "@/components/library/ReadAloud";

const SUMMARY_TYPES = [
  { value: "chapter", label: "Chapter Summary" },
  { value: "page", label: "Page Summary" },
  { value: "book", label: "Book Summary" },
  { value: "bullet", label: "Bullet Summary" },
];

const NOTES_TYPES = [
  { value: "auto", label: "Auto Notes" },
  { value: "short", label: "Short Notes" },
  { value: "revision", label: "Revision Notes" },
  { value: "flashcards", label: "Flashcards" },
];

// Small "# / ## / -" formatter — same mini-markdown convention used by
// Notes Generator, AI Tutor, Coding Mentor, and Writing Assistant.
function renderResult(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={i} style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: i === 0 ? 0 : "18px", marginBottom: "10px" }}>
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} style={{ fontSize: "1rem", fontWeight: 700, color: "#F59E0B", marginTop: "16px", marginBottom: "8px" }}>
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.6 }}>
          <span style={{ color: "#F59E0B" }}>•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    if (trimmed === "") {
      return <div key={i} style={{ height: "6px" }} />;
    }
    return (
      <p key={i} style={{ color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.7, marginBottom: "8px" }}>
        {trimmed}
      </p>
    );
  });
}

export default function AIBookToolsPage() {
  const [mode, setMode] = useState<BookToolMode>("explain");
  const [language, setLanguage] = useState<BookToolsLanguage>("english");
  const [text, setText] = useState("");

  // If the student came here via the Reader's "Ask AI about this page"
  // button, that page's text is waiting in sessionStorage — load it once,
  // then clear it so it doesn't reappear on a later visit.
  useEffect(() => {
    const handoff = sessionStorage.getItem("mentora_book_tools_prefill");
    if (handoff) {
      setText(handoff);
      sessionStorage.removeItem("mentora_book_tools_prefill");
    }
  }, []);

  const [summaryType, setSummaryType] = useState("chapter");
  const [notesType, setNotesType] = useState("auto");
  const [questionCount, setQuestionCount] = useState(5);
  const [pyqStyle, setPyqStyle] = useState(false);

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: "999px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".78rem",
    cursor: "pointer",
  });

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Please paste some text from the book first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");

    try {
      const res = await fetch("/api/book-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          text,
          language,
          summaryType,
          notesType,
          questionCount,
          pyqStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate.");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "white",
    fontSize: ".9rem",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical" as const,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif", padding: "32px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link href="/library" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
          ← Back to Library
        </Link>

        <header style={{ margin: "14px 0 22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            AI Book <span style={G.gradText}>Tools</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Paste text from any book — get it explained, summarized, turned into notes, or quizzed on.
          </p>
        </header>

        <BookToolsTabs active={mode} onChange={(m) => { setMode(m); setResult(""); setError(null); }} />

        <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
              Language
            </label>
            <LanguageToggle value={language} onChange={setLanguage} />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
              Paste Text from the Book
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Copy-paste a paragraph, page, or chapter here..."
              style={inputStyle}
            />
            <p style={{ color: "#475569", fontSize: ".72rem", marginTop: "6px" }}>
              Since real PDF/EPUB files aren't hosted yet, tools work on text you paste in — once book
              files are added, this will auto-fill from the page you're reading.
            </p>
          </div>

          {mode === "summary" && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                Summary Type
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {SUMMARY_TYPES.map((t) => (
                  <button key={t.value} style={chipBtn(summaryType === t.value)} onClick={() => setSummaryType(t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "notes" && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                Notes Type
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {NOTES_TYPES.map((t) => (
                  <button key={t.value} style={chipBtn(notesType === t.value)} onClick={() => setNotesType(t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "quiz" && (
            <div style={{ marginBottom: "18px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                  Number of Questions
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[5, 10, 15].map((n) => (
                    <button key={n} style={chipBtn(questionCount === n)} onClick={() => setQuestionCount(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                  Style
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={chipBtn(!pyqStyle)} onClick={() => setPyqStyle(false)}>
                    Standard MCQs
                  </button>
                  <button style={chipBtn(pyqStyle)} onClick={() => setPyqStyle(true)}>
                    PYQ Style
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "voice" ? (
            <ReadAloud text={text} />
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%",
                background: G.grad,
                border: "none",
                color: "#111827",
                padding: "13px",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: ".95rem",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          )}

          {error && <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>{error}</p>}
        </div>

        {result && mode !== "voice" && (
          <div style={{ ...G.card, padding: "24px" }}>{renderResult(result)}</div>
        )}
      </div>
    </div>
  );
}