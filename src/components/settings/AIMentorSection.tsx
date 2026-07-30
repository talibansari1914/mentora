"use client";

import { useState } from "react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { AiMentorSettings } from "@/services/settingsService";

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

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "AI Mentor settings updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message ?? "Could not save." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div>
      <SectionHeading
        title="AI Mentor Settings"
        hint="Controls how AI Tutor, Coding Mentor, and Writing Assistant respond to you."
      />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="AI Personality" />
        <ChipGroup options={PERSONALITIES} value={v.personality} onChange={(personality) => setV({ ...v, personality })} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Explanation Style" />
        <ChipGroup
          options={STYLES}
          value={v.explanationStyle}
          onChange={(explanationStyle) => setV({ ...v, explanationStyle })}
        />
      </div>

      <div style={{ marginBottom: "8px" }}>
        <FieldLabel title="Response Language" />
        <ChipGroup options={LANGUAGES} value={v.language} onChange={(language) => setV({ ...v, language })} />
      </div>

      <div style={{ margin: "24px 0" }}>
        <Toggle
          checked={v.rememberProgress}
          onChange={(rememberProgress) => setV({ ...v, rememberProgress })}
          label="Remember My Progress"
          hint="Let AI reference your weak subjects and past tests to personalize answers."
        />
      </div>

      <SectionHeading title="Auto-Generate After Each Session" />
      <div style={{ marginBottom: "24px" }}>
        <Toggle
          checked={v.autoGenerateNotes}
          onChange={(autoGenerateNotes) => setV({ ...v, autoGenerateNotes })}
          label="Notes"
          hint="Automatically save a summary note after a Doubt Solver session."
        />
        <Toggle
          checked={v.autoGenerateFlashcards}
          onChange={(autoGenerateFlashcards) => setV({ ...v, autoGenerateFlashcards })}
          label="Flashcards"
          hint="Add reviewed topics to Memory Assistant automatically."
        />
        <Toggle
          checked={v.autoGenerateQuiz}
          onChange={(autoGenerateQuiz) => setV({ ...v, autoGenerateQuiz })}
          label="Quiz"
          hint="Suggest a quick quiz after finishing a topic."
        />
        <Toggle
          checked={v.autoGenerateSummary}
          onChange={(autoGenerateSummary) => setV({ ...v, autoGenerateSummary })}
          label="Summary"
          hint="Summarize long AI answers at the end automatically."
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}