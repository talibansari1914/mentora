"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { settingsService } from "@/services/settingsService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

type Level = "beginner" | "advanced";
type Language = "english" | "hindi" | "hinglish";

interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

export default function AiMentorPage() {
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [language, setLanguage] = useState<Language>("english");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // AI Mentor personality/style, pulled from Settings → AI Mentor.
  const [personality, setPersonality] = useState("Friendly");
  const [explanationStyle, setExplanationStyle] = useState("Detailed");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await settingsService.getSettings();
        if (cancelled) return;
        setPersonality(settings.ai_mentor.personality);
        setExplanationStyle(settings.ai_mentor.explanationStyle);
        const savedLang = settings.ai_mentor.language.toLowerCase();
        if (savedLang === "hindi" || savedLang === "hinglish" || savedLang === "english") {
          setLanguage(savedLang as Language);
        }
      } catch {
        // Settings couldn't be loaded — fall back to defaults.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

    if (!validTypes.includes(file.type)) {
      setError("Only PNG, JPEG, WEBP images or PDF files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      setAttachedFile({
        name: file.name,
        mimeType: file.type,
        data: base64,
        previewUrl: file.type.startsWith("image/") ? result : "",
      });
      setError(null);
    };
    reader.onerror = () => setError("Could not read the file. Please try again.");
    reader.readAsDataURL(file);
  }

  function removeFile() {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!question.trim() && !attachedFile) {
      setError("Please type a question or upload an image/PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          level,
          language,
          personality,
          explanationStyle,
          file: attachedFile
            ? { mimeType: attachedFile.mimeType, data: attachedFile.data }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get an answer.");
      }

      setAnswer(data.answer);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
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
    mutedText: "var(--theme-muted-text, #475569)",
    cardBg: "var(--theme-card-bg, #0B1220)",
    cardBorder: "1px solid var(--theme-border, rgba(255,255,255,.06))",
    inputBg: "var(--theme-hover-bg, #0F172A)",
    inputBorder: "1px solid var(--theme-border, rgba(255,255,255,.08))",
    fileCardBorder: "1px solid var(--theme-border, rgba(255,255,255,.08))",
    fileText: "var(--theme-text-sub, #CBD5E1)",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
  };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : "1px solid var(--theme-border, #CBD5E1)",
    background: active ? G.grad : "transparent",
    color: active ? "var(--theme-accent-text, #111827)" : themeStyles.subText,
    fontWeight: 700,
    fontSize: ".82rem",
    cursor: "pointer",
    transition: "background 0.3s, color 0.3s, border 0.3s",
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
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            AI <span style={G.gradText}>Mentor</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Ask any doubt — type it, or upload an image / PDF (even handwritten notes).
          </p>
          <p style={{ color: themeStyles.mutedText, fontSize: ".78rem", marginTop: "8px" }}>
            Personality: <strong style={{ color: themeStyles.subText }}>{personality}</strong> · Style:{" "}
            <strong style={{ color: themeStyles.subText }}>{explanationStyle}</strong> ·{" "}
            <Link href="/settings" style={{ color: "var(--theme-accent, #F59E0B)", textDecoration: "none" }}>
              Change in Settings
            </Link>
          </p>
        </header>

        <div style={{ ...cardStyle, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your doubt here..."
              rows={4}
              style={{
                width: "100%",
                background: themeStyles.inputBg,
                border: themeStyles.inputBorder,
                borderRadius: "10px",
                padding: "12px 14px",
                color: themeStyles.color,
                fontSize: ".9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                transition: "background 0.3s, color 0.3s, border 0.3s",
              }}
            />
          </div>

          {!attachedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                border: "1px dashed var(--theme-border, #94A3B8)",
                background: "transparent",
                color: themeStyles.subText,
                padding: "14px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: ".85rem",
                marginBottom: "16px",
                transition: "border-color 0.3s, color 0.3s",
              }}
            >
              📎 Upload image or PDF (optional)
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: themeStyles.fileCardBorder,
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "16px",
                background: themeStyles.inputBg,
                transition: "background 0.3s, border 0.3s",
              }}
            >
              {attachedFile.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachedFile.previewUrl}
                  alt="attachment preview"
                  style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                />
              ) : (
                <span style={{ fontSize: "1.4rem" }}>📄</span>
              )}
              <span style={{ fontSize: ".85rem", color: themeStyles.fileText, flex: 1 }}>
                {attachedFile.name}
              </span>
              <button
                onClick={removeFile}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontSize: ".8rem",
                }}
              >
                Remove
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              marginBottom: "18px",
            }}
          >
            <div>
              <p
                style={{
                  color: themeStyles.subText,
                  fontSize: ".75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Level
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button style={toggleBtn(level === "beginner")} onClick={() => setLevel("beginner")}>
                  Beginner
                </button>
                <button style={toggleBtn(level === "advanced")} onClick={() => setLevel("advanced")}>
                  Advanced
                </button>
              </div>
            </div>

            <div>
              <p
                style={{
                  color: themeStyles.subText,
                  fontSize: ".75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Language
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button style={toggleBtn(language === "english")} onClick={() => setLanguage("english")}>
                  English
                </button>
                <button style={toggleBtn(language === "hindi")} onClick={() => setLanguage("hindi")}>
                  Hindi
                </button>
                <button style={toggleBtn(language === "hinglish")} onClick={() => setLanguage("hinglish")}>
                  Hinglish
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
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
            {loading ? "Thinking..." : "Solve My Doubt"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>
              {error}
            </p>
          )}
        </div>

        {answer && (
          <div style={{ ...cardStyle, padding: "26px" }}>{renderMarkdownLite(answer, { headingColor: themeStyles.color, textColor: themeStyles.fileText })}</div>
        )}
      </div>
    </div>
  );
}