"use client";

import { useState } from "react";
import { G, inputStyle, primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, MultiChipGroup } from "./shared";
import type { StudyPreferences } from "@/services/settingsService";

const TIMES = ["Early Morning", "Morning", "Afternoon", "Evening", "Night"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly"];
const SUBJECT_OPTIONS = [
  "Polity", "History", "Geography", "Economy", "Environment", "CSAT",
  "Physics", "Chemistry", "Maths", "Biology", "Reasoning", "English", "GK",
];

export default function StudyPreferencesSection({
  value,
  onSave,
}: {
  value: StudyPreferences;
  onSave: (v: StudyPreferences) => Promise<void>;
}) {
  const [v, setV] = useState<StudyPreferences>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Study preferences updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message ?? "Could not save." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div>
      <SectionHeading title="Study Preferences" hint="Used to personalize your daily plan and reminders." />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div>
          <FieldLabel title="Daily Study Goal (hours)" />
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={v.dailyGoalHours}
            onChange={(e) => setV({ ...v, dailyGoalHours: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel title="Weekly Goal (hours)" />
          <input
            type="number"
            min={1}
            value={v.weeklyGoalHours}
            onChange={(e) => setV({ ...v, weeklyGoalHours: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Preferred Study Time" />
        <ChipGroup options={TIMES} value={v.preferredTime} onChange={(preferredTime) => setV({ ...v, preferredTime })} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Study Level" />
        <ChipGroup options={LEVELS} value={v.studyLevel} onChange={(studyLevel) => setV({ ...v, studyLevel })} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Preferred Subjects" hint="Used to prioritize what shows up first in Notes and Practice." />
        <MultiChipGroup
          options={SUBJECT_OPTIONS}
          values={v.preferredSubjects}
          onChange={(preferredSubjects) => setV({ ...v, preferredSubjects })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div>
          <FieldLabel title="Daily Reminder Time" />
          <input
            type="time"
            value={v.reminderTime}
            onChange={(e) => setV({ ...v, reminderTime: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel title="Revision Frequency" />
          <select
            value={v.revisionFrequency}
            onChange={(e) => setV({ ...v, revisionFrequency: e.target.value })}
            style={inputStyle}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}