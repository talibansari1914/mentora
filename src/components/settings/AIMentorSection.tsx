"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { AiMentorSettings } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

const PERSONALITIES = ["Friendly", "Strict Teacher", "Professional", "Motivational", "Exam Coach"];
const STYLES = ["Short", "Detailed", "Bullet Points", "Examples", "Story Based"];
const LANGUAGES = ["English", "Hindi", "Hinglish"];

export default function AIMentorSection({
  value,
  onSave,
}: {
  value: AiMentorSettings;
  onSave: (v: AiMentorSettings) => Promise<void>;
}) {
  const [v, setV] = useState<AiMentorSettings>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync internal state if incoming value prop changes
  useEffect(() => {
    setV(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "AI Mentor settings updated." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save settings.") });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no MutationObserver, no localStorage polling — it stays
  // perfectly in sync and reacts instantly to the toggle.
  const cardContainerStyle: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxSizing: "border-box",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid var(--theme-border)",
    paddingTop: "14px",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 480px) {
          .ai-mentor-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      <SectionHeading
        title="AI Mentor Settings"
        hint="Controls how AI Mentor, Coding Mentor, and Writing Assistant respond to you."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      {/* Main Preferences Block */}
      <div style={cardContainerStyle}>
        <div>
          <FieldLabel title="AI Personality" />
          <ChipGroup
            options={PERSONALITIES}
            value={v.personality}
            onChange={(personality) => setV({ ...v, personality })}
          />
        </div>

        <div style={dividerStyle}>
          <FieldLabel title="Explanation Style" />
          <ChipGroup
            options={STYLES}
            value={v.explanationStyle}
            onChange={(explanationStyle) => setV({ ...v, explanationStyle })}
          />
        </div>

        <div style={dividerStyle}>
          <FieldLabel title="Response Language" />
          <ChipGroup
            options={LANGUAGES}
            value={v.language}
            onChange={(language) => setV({ ...v, language })}
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.rememberProgress}
            onChange={(rememberProgress) => setV({ ...v, rememberProgress })}
            label="Remember My Progress"
            hint="Let AI reference your weak subjects and past tests to personalize answers."
          />
        </div>
      </div>

      {/* Auto-Generate Options Block */}
      <SectionHeading title="Auto-Generate After Each Session" />

      <div style={cardContainerStyle}>
        <Toggle
          checked={v.autoGenerateNotes}
          onChange={(autoGenerateNotes) => setV({ ...v, autoGenerateNotes })}
          label="Notes"
          hint="Automatically save a summary note after a Doubt Solver session."
        />

        <div style={dividerStyle}>
          <Toggle
            checked={v.autoGenerateFlashcards}
            onChange={(autoGenerateFlashcards) => setV({ ...v, autoGenerateFlashcards })}
            label="Flashcards"
            hint="Add reviewed topics to Memory Assistant automatically."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.autoGenerateQuiz}
            onChange={(autoGenerateQuiz) => setV({ ...v, autoGenerateQuiz })}
            label="Quiz"
            hint="Suggest a quick quiz after finishing a topic."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.autoGenerateSummary}
            onChange={(autoGenerateSummary) => setV({ ...v, autoGenerateSummary })}
            label="Summary"
            hint="Summarize long AI answers at the end automatically."
          />
        </div>
      </div>

      {/* Action Button - Mobile Responsive */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="ai-mentor-save-btn"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...primaryBtn(saving),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            maxWidth: "220px",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.88rem",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.18s ease-out",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} style={{ flexShrink: 0 }} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}