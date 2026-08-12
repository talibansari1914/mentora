"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsService } from "@/services/settingsService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

// "writing" covers the 4 content types below (essay/email/application/letter)
// via the Content Type dropdown; grammar/rewrite/paraphrase are unchanged,
// separate tabs exactly as before.
type Tab = "writing" | "grammar" | "rewrite" | "paraphrase";
type ContentType = "essay" | "email" | "application" | "letter";

const TABS: { value: Tab; label: string }[] = [
  { value: "writing", label: "Writing" },
  { value: "grammar", label: "Grammar Check" },
  { value: "rewrite", label: "Rewrite" },
  { value: "paraphrase", label: "Reduce Similarity" },
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "essay", label: "Essay" },
  { value: "email", label: "Email" },
  { value: "application", label: "Application" },
  { value: "letter", label: "Letter" },
];

// Sub-type options per content type - only email/application/letter need
// one (essay doesn't). Matches the *_SUBTYPE_GUIDANCE maps in
// src/app/api/writing-assistant/route.ts - keep both in sync if you add
// a new sub-type.
const SUBTYPES_BY_CONTENT_TYPE: Partial<Record<ContentType, { value: string; label: string }[]>> = {
  email: [
    { value: "job", label: "Job / Company Email" },
    { value: "cover_letter", label: "Cover Letter" },
    { value: "normal", label: "Normal Email" },
  ],
  application: [
    { value: "job", label: "Job Application" },
    { value: "leave", label: "Leave Application" },
    { value: "school", label: "School/College Application" },
    { value: "general", label: "General" },
  ],
  letter: [
    { value: "formal", label: "Formal Letter (to Authority)" },
    { value: "personal", label: "Personal Letter" },
    { value: "complaint", label: "Complaint Letter" },
  ],
};

// Dedicated to this page only - independent of the Settings language, which
// grammar/rewrite/paraphrase below continue to use exactly as before.
const WRITING_LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
];

const WORD_COUNTS = [150, 250, 500, 1000];
const TONES = ["Formal", "Analytical", "Persuasive", "Simple", "Academic"];

// Static theme-token style map — driven entirely by the shared --theme-* CSS
// variables set on <html data-theme="dark|light">, so this page always mirrors
// the dashboard toggle exactly with zero extra JS/state.
const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  subText: "var(--theme-text-sub)",
  mutedText: "var(--theme-text-sub)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
  inputBg: "var(--theme-card-bg)",
  inputColor: "var(--theme-text-main)",
  inputBorder: "1px solid var(--theme-border)",
  tabBorder: "var(--theme-border)",
};

const TEXT_LABEL_BY_CONTENT_TYPE: Record<ContentType, string> = {
  essay: "Essay Topic",
  email: "What should this email say?",
  application: "What should this application say?",
  letter: "What should this letter say?",
};

const TEXT_PLACEHOLDER_BY_CONTENT_TYPE: Record<ContentType, string> = {
  essay: "e.g. Role of Technology in Governance",
  email: "e.g. Ask HR at Infosys about the status of my job application submitted 2 weeks ago",
  application: "e.g. 3 days sick leave from 12th to 14th August, addressed to my manager Mr. Sharma",
  letter: "e.g. Complaint about frequent power cuts in our locality, addressed to the electricity board",
};

export default function WritingAssistantPage() {
  const [tab, setTab] = useState<Tab>("writing");
  const [contentType, setContentType] = useState<ContentType>("essay");
  const [subType, setSubType] = useState<string>("");
  const [writingLanguage, setWritingLanguage] = useState("english");

  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(250);
  const [tone, setTone] = useState("Formal");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Unchanged - still only used for grammar/rewrite/paraphrase, exactly as
  // before. The new "writing" tab uses its own independent language
  // dropdown (writingLanguage) instead.
  const [mentorLanguage, setMentorLanguage] = useState("english");

  const PERSONALITY_TO_TONE: Record<string, string> = {
    Friendly: "Simple",
    "Strict Teacher": "Formal",
    Professional: "Formal",
    Motivational: "Persuasive",
    "Exam Coach": "Analytical",
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await settingsService.getSettings();
        if (cancelled) return;
        setMentorLanguage(settings.ai_mentor.language.toLowerCase());
        const mappedTone = PERSONALITY_TO_TONE[settings.ai_mentor.personality];
        if (mappedTone) setTone(mappedTone);
      } catch {
        // Settings couldn't be loaded — fall back to defaults.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the content type changes, reset to that type's first sub-type
  // (or clear it for essay, which has none) so a stale sub-type from a
  // previous selection is never silently sent to the API.
  useEffect(() => {
    const options = SUBTYPES_BY_CONTENT_TYPE[contentType];
    setSubType(options ? options[0].value : "");
  }, [contentType]);

  const needsSubType = Boolean(SUBTYPES_BY_CONTENT_TYPE[contentType]);
  const needsWordCount = tab === "writing" && contentType === "essay";
  const needsTone = tab === "writing" ? contentType === "essay" : tab === "rewrite";

  const textLabel = tab === "writing" ? TEXT_LABEL_BY_CONTENT_TYPE[contentType] : "Paste Your Text";
  const textPlaceholder =
    tab === "writing"
      ? TEXT_PLACEHOLDER_BY_CONTENT_TYPE[contentType]
      : tab === "grammar"
      ? "Paste the text you want checked..."
      : tab === "rewrite"
      ? "Paste the text you want rewritten..."
      : "Paste the text you want to make more original...";

  async function handleSubmit() {
    if (!text.trim()) {
      setError(tab === "writing" && contentType === "essay" ? "Please enter an essay topic." : "Please describe what you need.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/writing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tab === "writing" ? contentType : tab,
          subType: tab === "writing" && needsSubType ? subType : undefined,
          text,
          wordCount: needsWordCount ? wordCount : undefined,
          tone: needsTone ? tone : undefined,
          responseLanguage: tab === "writing" ? writingLanguage : mentorLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get a response.");
      }

      setAnswer(data.answer);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: themeStyles.inputBg,
    border: themeStyles.inputBorder,
    borderRadius: "10px",
    padding: "11px 14px",
    color: themeStyles.inputColor,
    fontSize: ".9rem",
    outline: "none",
    fontFamily: "inherit",
    transition: "background 0.3s, color 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 16px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : `1px solid ${themeStyles.tabBorder}`,
    background: active ? G.grad : "transparent",
    color: active ? "var(--theme-accent-text)" : themeStyles.subText,
    fontWeight: 700,
    fontSize: ".82rem",
    cursor: "pointer",
    flex: "1 1 auto",
    textAlign: "center",
  });

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: "999px",
    border: active ? "1px solid transparent" : `1px solid ${themeStyles.tabBorder}`,
    background: active ? G.grad : "transparent",
    color: active ? "var(--theme-accent-text)" : themeStyles.subText,
    fontWeight: 700,
    fontSize: ".78rem",
    cursor: "pointer",
  });

  const fieldLabelStyle: React.CSSProperties = {
    display: "block",
    color: themeStyles.subText,
    fontSize: ".78rem",
    fontWeight: 600,
    marginBottom: "6px",
    textTransform: "uppercase",
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
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "22px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            AI Writing <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Write essays, emails, applications, and letters, fix grammar, rewrite in a different tone, or make your writing more original.
          </p>
          {tab !== "writing" && (
            <p style={{ color: themeStyles.mutedText, fontSize: ".78rem", marginTop: "8px" }}>
              Output language: <strong style={{ color: themeStyles.subText }}>{mentorLanguage}</strong> ·{" "}
              <Link href="/settings" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>
                Change in Settings
              </Link>
            </p>
          )}
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              style={tabBtn(tab === t.value)}
              onClick={() => {
                setTab(t.value);
                setAnswer("");
                setError(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ ...cardStyle, padding: "22px", marginBottom: "20px" }}>
          {tab === "writing" && (
            <div
              className="writing-type-language-grid"
              style={{ display: "grid", gridTemplateColumns: needsSubType ? "1fr 1fr 1fr" : "1fr 1fr", gap: "10px", marginBottom: "16px" }}
            >
              <div>
                <label style={fieldLabelStyle}>Content Type</label>
                <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)} style={selectStyle}>
                  {CONTENT_TYPES.map((c) => (
                    <option key={c.value} value={c.value} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {needsSubType && (
                <div>
                  <label style={fieldLabelStyle}>This is for</label>
                  <select value={subType} onChange={(e) => setSubType(e.target.value)} style={selectStyle}>
                    {SUBTYPES_BY_CONTENT_TYPE[contentType]!.map((s) => (
                      <option key={s.value} value={s.value} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={fieldLabelStyle}>Language</label>
                <select value={writingLanguage} onChange={(e) => setWritingLanguage(e.target.value)} style={selectStyle}>
                  {WRITING_LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={fieldLabelStyle}>{textLabel}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={tab === "writing" && contentType === "essay" ? 2 : 6}
              placeholder={textPlaceholder}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {needsWordCount && (
            <div style={{ marginBottom: "14px" }}>
              <label style={fieldLabelStyle}>Word Count</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {WORD_COUNTS.map((w) => (
                  <button key={w} style={chipBtn(wordCount === w)} onClick={() => setWordCount(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsTone && (
            <div style={{ marginBottom: "18px" }}>
              <label style={fieldLabelStyle}>Tone</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TONES.map((t) => (
                  <button key={t} style={chipBtn(tone === t)} onClick={() => setTone(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "var(--theme-accent-text)",
              padding: "13px",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: ".95rem",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Writing..." : "Generate"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>{error}</p>
          )}
        </div>

        {answer && (
          <div style={{ ...cardStyle, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <button
                onClick={handleCopy}
                style={{
                  background: "transparent",
                  border: `1px solid ${themeStyles.tabBorder}`,
                  color: copied ? "#22C55E" : themeStyles.subText,
                  fontSize: ".78rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {renderMarkdownLite(answer, { textColor: themeStyles.subText })}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:600px){.writing-type-language-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}