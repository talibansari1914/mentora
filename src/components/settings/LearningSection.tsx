"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { LearningPreferences } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const FREQUENCIES = ["Daily", "Every 2 days", "Weekly"];

export default function LearningSection({
  value,
  onSave,
}: {
  value: LearningPreferences;
  onSave: (v: LearningPreferences) => Promise<void>;
}) {
  const [v, setV] = useState<LearningPreferences>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state if external prop changes
  useEffect(() => {
    setV(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Learning preferences updated." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save.") });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const cardContainerStyle: React.CSSProperties = {
    background: "var(--theme-card-bg, var(--card-bg, transparent))",
    border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.2))",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid var(--theme-border, rgba(150, 150, 150, 0.15))",
    paddingTop: "16px",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 480px) {
          .learning-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Learning Preferences"
        hint="Fine-tune how Daily Practice and Mock Tests behave."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      {/* Difficulty & Frequency Block */}
      <div style={cardContainerStyle}>
        <div>
          <FieldLabel title="Default Difficulty Level" hint="Sets default difficulty for new test sets." />
          <ChipGroup
            options={DIFFICULTIES}
            value={v.difficultyLevel}
            onChange={(difficultyLevel) => setV({ ...v, difficultyLevel })}
          />
        </div>

        <div style={dividerStyle}>
          <FieldLabel title="Practice Question Frequency" hint="How often practice sets refresh." />
          <ChipGroup
            options={FREQUENCIES}
            value={v.questionFrequency}
            onChange={(questionFrequency) => setV({ ...v, questionFrequency })}
          />
        </div>
      </div>

      {/* Smart Practice & Reminders Block */}
      <SectionHeading title="Smart Practice & Reminders" />

      <div style={cardContainerStyle}>
        <Toggle
          checked={v.dailyQuiz}
          onChange={(dailyQuiz) => setV({ ...v, dailyQuiz })}
          label="Daily Quiz Reminder"
          hint="Get nudged to complete a Daily Practice set each day."
        />

        <div style={dividerStyle}>
          <Toggle
            checked={v.weeklyMockTest}
            onChange={(weeklyMockTest) => setV({ ...v, weeklyMockTest })}
            label="Weekly Mock Test Reminder"
            hint="Get nudged to attempt a full mock test once a week."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.adaptiveLearning}
            onChange={(adaptiveLearning) => setV({ ...v, adaptiveLearning })}
            label="Adaptive Learning"
            hint="Bias new questions toward your weak subjects."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.spacedRepetition}
            onChange={(spacedRepetition) => setV({ ...v, spacedRepetition })}
            label="Spaced Repetition"
            hint="Use the Memory Assistant's SM-2 scheduling for revisions."
          />
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="learning-save-btn"
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