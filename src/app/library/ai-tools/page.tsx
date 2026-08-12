"use client";

import { useState, useEffect } from "react";
import BookToolsTabs, { BookToolMode } from "@/components/library/BookToolsTabs";
import LanguageToggle, { BookToolsLanguage } from "@/components/library/LanguageToggle";
import ReadAloud from "@/components/library/ReadAloud";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

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

export default function AIBookToolsPage() {
  // States
  const [mode, setMode] = useState<BookToolMode>("explain");
  const [language, setLanguage] = useState<BookToolsLanguage>("english");
  const [text, setText] = useState("");
  const [summaryType, setSummaryType] = useState("chapter");
  const [notesType, setNotesType] = useState("auto");
  const [questionCount, setQuestionCount] = useState(5);
  const [pyqStyle, setPyqStyle] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: sessionStorage sirf browser (client) mein chalega
  useEffect(() => {
    const handoff = sessionStorage.getItem("mentora_book_tools_prefill");
    if (handoff) {
      setText(handoff);
      sessionStorage.removeItem("mentora_book_tools_prefill");
    }
  }, []);

  // ✅ Theme CSS Variables (globals.css sync)
  const themeStyles = {
    bg: "var(--theme-bg-main, #080c14)",
    color: "var(--theme-text-main, #f8fafc)",
    subText: "var(--theme-text-sub, #94a3b8)",
    bodyText: "var(--theme-muted-text, #64748b)",
    cardBg: "var(--theme-card-bg, #0f172a)",
    cardBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    inputBg: "var(--theme-card-bg, #0f172a)",
    inputBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    chipActiveBg: "var(--theme-accent, #f59e0b)",
    // Text sitting ON TOP of the accent background needs the accent-contrast
    // variable, not the page's main text color — theme-text-main flips
    // per theme independently of the accent, which washes out in dark mode
    // (near-white text on the amber chip). theme-accent-text is defined
    // specifically for this and is already correct in both themes.
    chipActiveColor: "var(--theme-accent-text, #070B14)",
    chipBg: "var(--theme-card-bg, #0f172a)",
    chipColor: "var(--theme-text-sub, #94a3b8)",
    chipBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
  };

  // ---------- Chip Button ----------
  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: "999px",
    border: `1px solid ${active ? themeStyles.chipActiveBg : themeStyles.chipBorder}`,
    background: active ? themeStyles.chipActiveBg : themeStyles.chipBg,
    color: active ? themeStyles.chipActiveColor : themeStyles.chipColor,
    fontWeight: 700,
    fontSize: "0.78rem",
    cursor: "pointer",
    boxShadow: active ? "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))" : "none",
    transition: "all 0.15s ease",
  });

  // ---------- Handle Generate ----------
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }

  // ---------- Styles ----------
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    borderRadius: "12px",
    padding: "14px",
    color: themeStyles.color,
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical" as const,
    transition: "all 0.2s ease",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: `1px solid ${themeStyles.cardBorder}`,
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
  };

  // ---------- Render ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans', sans-serif",
        padding: "20px 12px",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <style jsx global>{`
        @media (min-width: 640px) {
          .book-tools-wrapper {
            padding: 32px 24px !important;
          }
        }
      `}</style>

      <div className="book-tools-wrapper" style={{ maxWidth: "820px", margin: "0 auto", width: "100%" }}>
        <BackToDashboardLink href="/library" label="Back to Library" />

        <header style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              color: themeStyles.color,
              marginBottom: "8px",
            }}
          >
            AI Book <span style={{ color: "var(--theme-accent, #f59e0b)" }}>Tools</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: "0.95rem" }}>
            Paste text from any book — get it explained, summarized, turned into notes, or quizzed on.
          </p>
        </header>

        <div style={{ width: "100%", overflowX: "auto", marginBottom: "16px" }}>
          <BookToolsTabs
            active={mode}
            onChange={(m) => {
              setMode(m);
              setResult("");
              setError(null);
            }}
          />
        </div>

        <div style={{ ...cardStyle, padding: "20px", marginBottom: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: themeStyles.subText,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Language
            </label>
            <div style={{ overflowX: "auto" }}>
              <LanguageToggle value={language} onChange={setLanguage} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: themeStyles.subText,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Paste Text from the Book
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Copy-paste a paragraph, page, or chapter here..."
              style={inputStyle}
            />
            <p style={{ color: themeStyles.subText, fontSize: "0.75rem", marginTop: "6px" }}>
              Tools work on text you paste in — once book files are added, this will auto-fill from the page
              you're reading.
            </p>
          </div>

          {mode === "summary" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  color: themeStyles.subText,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Summary Type
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {SUMMARY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    style={chipBtn(summaryType === t.value)}
                    onClick={() => setSummaryType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "notes" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  color: themeStyles.subText,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Notes Type
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {NOTES_TYPES.map((t) => (
                  <button
                    key={t.value}
                    style={chipBtn(notesType === t.value)}
                    onClick={() => setNotesType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "quiz" && (
            <div style={{ marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    color: themeStyles.subText,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Number of Questions
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      style={chipBtn(questionCount === n)}
                      onClick={() => setQuestionCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: themeStyles.subText,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Style
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                background: "var(--theme-accent, #f59e0b)",
                border: "none",
                color: "var(--theme-accent-text, #070B14)",
                padding: "14px",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "0.95rem",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          )}

          {error && (
            <p style={{ color: "#EF4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: 600 }}>
              {error}
            </p>
          )}
        </div>

        {result && mode !== "voice" && (
          <div style={{ ...cardStyle, padding: "24px" }}>{renderMarkdownLite(result, { headingColor: themeStyles.color, textColor: themeStyles.bodyText })}</div>
        )}
      </div>
    </div>
  );
}