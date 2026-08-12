"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, BookOpen, Clock, Target } from "lucide-react";
import {
  G,
  inputStyle,
  primaryBtn,
  Toast,
  FieldLabel,
  SectionHeading,
  ChipGroup,
  MultiChipGroup,
} from "./shared";
import type { StudyPreferences } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

const TIMES = ["Early Morning", "Morning", "Afternoon", "Evening", "Night"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly"];
const SUBJECT_OPTIONS = [
  "Polity",
  "History",
  "Geography",
  "Economy",
  "Environment",
  "CSAT",
  "Physics",
  "Chemistry",
  "Maths",
  "Biology",
  "Reasoning",
  "English",
  "GK",
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

  // Sync state if props update from parent
  useEffect(() => {
    setV(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Study preferences updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save study preferences.") });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--theme-card-bg, var(--card-bg, transparent))",
    border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.2))",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  };

  const responsiveGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  };

  const selectOptionStyle: React.CSSProperties = {
    background: "var(--theme-card-bg, #0B0F19)",
    color: "var(--theme-text-main, inherit)",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 480px) {
          .study-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Study Preferences"
        hint="Used to personalize your daily study plan, reminders, and subject priority."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      {/* Goals & Timing Card */}
      <div style={cardStyle}>
        <div style={responsiveGridStyle}>
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

        <div style={responsiveGridStyle}>
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
                <option key={f} value={f} style={selectOptionStyle}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Routine & Level Preferences Card */}
      <div style={cardStyle}>
        <div>
          <FieldLabel title="Preferred Study Time" hint="Select when you feel most productive." />
          <ChipGroup
            options={TIMES}
            value={v.preferredTime}
            onChange={(preferredTime) => setV({ ...v, preferredTime })}
          />
        </div>

        <div>
          <FieldLabel title="Study Level" hint="Tailors the difficulty of generated practice sets." />
          <ChipGroup
            options={LEVELS}
            value={v.studyLevel}
            onChange={(studyLevel) => setV({ ...v, studyLevel })}
          />
        </div>
      </div>

      {/* Subject Focus Card */}
      <div style={cardStyle}>
        <div>
          <FieldLabel
            title="Preferred Subjects"
            hint="Used to prioritize what shows up first in Notes, AI Mentor, and Practice."
          />
          <MultiChipGroup
            options={SUBJECT_OPTIONS}
            values={v.preferredSubjects}
            onChange={(preferredSubjects) => setV({ ...v, preferredSubjects })}
          />
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="study-save-btn"
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