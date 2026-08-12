"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsService } from "@/services/settingsService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

type Mode = "doubt" | "explain" | "debug" | "generate" | "practice";

const MODES: { value: Mode; label: string }[] = [
  { value: "doubt", label: "Doubt" },
  { value: "explain", label: "Explain Code" },
  { value: "debug", label: "Debug" },
  { value: "generate", label: "Generate Code" },
  { value: "practice", label: "Practice Questions" },
];

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "SQL"];

interface ContentBlock {
  type: "text" | "code";
  content: string;
  lang?: string;
}

function parseContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    blocks.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.slice(lastIndex) });
  }

  return blocks;
}

function renderTextBlock(text: string, textColor: string) {
  return renderMarkdownLite(text, { textColor });
}

// Code blocks intentionally stay dark (terminal-style) in both light and dark
// page themes — same convention as GitHub/VS Code, since code is more
// readable on a fixed dark background regardless of the page around it.
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  return (
    <div style={{ margin: "10px 0", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#111827",
          padding: "8px 14px",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        <span style={{ color: "#94A3B8", fontSize: ".75rem", fontWeight: 600 }}>
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "none",
            color: copied ? "#22C55E" : "#94A3B8",
            fontSize: ".75rem",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px",
          background: "#0A0F1A",
          overflowX: "auto",
          fontSize: ".82rem",
          lineHeight: 1.6,
          fontFamily: "'Fira Code','Courier New',monospace",
          color: "#E2E8F0",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderAnswer(text: string, textColor: string) {
  const blocks = parseContent(text);
  return blocks.map((block, i) =>
    block.type === "code" ? (
      <CodeBlock key={i} code={block.content} lang={block.lang} />
    ) : (
      <div key={i}>{renderTextBlock(block.content, textColor)}</div>
    )
  );
}

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

export default function CodingMentorPage() {
  const [mode, setMode] = useState<Mode>("doubt");
  const [language, setLanguage] = useState("Python");
  const [question, setQuestion] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personality, setPersonality] = useState("Friendly");
  const [explanationStyle, setExplanationStyle] = useState("Detailed");
  const [mentorLanguage, setMentorLanguage] = useState("english");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await settingsService.getSettings();
        if (cancelled) return;
        setPersonality(settings.ai_mentor.personality);
        setExplanationStyle(settings.ai_mentor.explanationStyle);
        setMentorLanguage(settings.ai_mentor.language.toLowerCase());
      } catch {
        // Settings couldn't be loaded — fall back to defaults.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const needsCode = mode === "explain" || mode === "debug";
  const needsError = mode === "debug";

  const questionLabel: Record<Mode, string> = {
    doubt: "What's your doubt?",
    explain: "Anything specific you want explained? (optional)",
    debug: "Extra context (optional)",
    generate: "Describe what the code should do",
    practice: "Topic for practice questions",
  };

  // Mirrors the validation in src/app/api/code-mentor/route.ts, so a bad
  // submission is caught instantly here instead of only after a round trip
  // to the server.
  function validate(): string | null {
    if (needsCode && !code.trim()) {
      return "Please paste your code.";
    }
    if ((mode === "doubt" || mode === "generate" || mode === "practice") && !question.trim()) {
      return mode === "doubt"
        ? "Please describe your doubt."
        : mode === "generate"
        ? "Please describe what you want the code to do."
        : "Please enter a topic for practice questions.";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/code-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          language,
          question,
          code: needsCode ? code : undefined,
          errorMessage: needsError ? errorMessage : undefined,
          personality,
          explanationStyle,
          responseLanguage: mentorLanguage,
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
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <header style={{ marginBottom: "22px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            AI Coding <span style={G.gradText}>Mentor</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Ask a doubt, get your code explained, debug an error, generate code, or practice.
          </p>
          <p style={{ color: themeStyles.mutedText, fontSize: ".78rem", marginTop: "8px" }}>
            Personality: <strong style={{ color: themeStyles.subText }}>{personality}</strong> · Style:{" "}
            <strong style={{ color: themeStyles.subText }}>{explanationStyle}</strong> ·{" "}
            <Link href="/settings" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>
              Change in Settings
            </Link>
          </p>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button key={m.value} style={tabBtn(mode === m.value)} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ ...cardStyle, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", color: themeStyles.subText, fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              Language
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {needsCode && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: themeStyles.subText, fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                Your Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={8}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "'Fira Code','Courier New',monospace", fontSize: ".85rem" }}
              />
            </div>
          )}

          {needsError && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: themeStyles.subText, fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                Error Message (optional)
              </label>
              <input
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="e.g. TypeError: cannot read property 'x' of undefined"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: themeStyles.subText, fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              {questionLabel[mode]}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={mode === "explain" || mode === "debug" ? 2 : 4}
              placeholder={
                mode === "generate"
                  ? "e.g. A function that checks if a string is a palindrome"
                  : mode === "practice"
                  ? "e.g. Recursion, Linked Lists, Binary Search"
                  : "Type here..."
              }
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

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
            {loading ? "Thinking..." : "Ask Mentor"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>{error}</p>
          )}
        </div>

        {answer && <div style={{ ...cardStyle, padding: "24px" }}>{renderAnswer(answer, themeStyles.subText)}</div>}
      </div>
    </div>
  );
}