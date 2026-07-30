"use client";

import { useState } from "react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { LearningPreferences } from "@/services/settingsService";

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

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Learning preferences updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message ?? "Could not save." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div>
      <SectionHeading title="Learning Preferences" hint="Fine-tune how Daily Practice and Mock Tests behave." />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Default Difficulty Level" />
        <ChipGroup
          options={DIFFICULTIES}
          value={v.difficultyLevel}
          onChange={(difficultyLevel) => setV({ ...v, difficultyLevel })}
        />
      </div>

      <div style={{ marginBottom: "8px" }}>
        <FieldLabel title="Practice Question Frequency" />
        <ChipGroup
          options={FREQUENCIES}
          value={v.questionFrequency}
          onChange={(questionFrequency) => setV({ ...v, questionFrequency })}
        />
      </div>

      <div style={{ margin: "16px 0 24px" }}>
        <Toggle
          checked={v.dailyQuiz}
          onChange={(dailyQuiz) => setV({ ...v, dailyQuiz })}
          label="Daily Quiz Reminder"
          hint="Get nudged to complete a Daily Practice set each day."
        />
        <Toggle
          checked={v.weeklyMockTest}
          onChange={(weeklyMockTest) => setV({ ...v, weeklyMockTest })}
          label="Weekly Mock Test Reminder"
          hint="Get nudged to attempt a full mock test once a week."
        />
        <Toggle
          checked={v.adaptiveLearning}
          onChange={(adaptiveLearning) => setV({ ...v, adaptiveLearning })}
          label="Adaptive Learning"
          hint="Bias new questions toward your weak subjects."
        />
        <Toggle
          checked={v.spacedRepetition}
          onChange={(spacedRepetition) => setV({ ...v, spacedRepetition })}
          label="Spaced Repetition"
          hint="Use the Memory Assistant's SM-2 scheduling for revisions."
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}