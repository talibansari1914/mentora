"use client";

import { useState } from "react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup } from "./shared";
import type { LanguageRegionSettings } from "@/services/settingsService";

const APP_LANGUAGES = ["English", "Hindi"];
const CONTENT_LANGUAGES = ["English", "Hindi", "Hinglish"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const TIME_FORMATS = ["12-hour", "24-hour"];

export default function LanguageRegionSection({
  value,
  onSave,
}: {
  value: LanguageRegionSettings;
  onSave: (v: LanguageRegionSettings) => Promise<void>;
}) {
  const [v, setV] = useState<LanguageRegionSettings>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Language & region updated." });
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
        title="Language & Region"
        hint="App Language changes menus and buttons once translations are added — Content Language already affects Notes Generator, AI Tutor, and Daily Practice."
      />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="App Language" />
        <ChipGroup options={APP_LANGUAGES} value={v.appLanguage} onChange={(appLanguage) => setV({ ...v, appLanguage })} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Content Language" hint="Used by AI Tutor and Notes Generator." />
        <ChipGroup
          options={CONTENT_LANGUAGES}
          value={v.contentLanguage}
          onChange={(contentLanguage) => setV({ ...v, contentLanguage })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div>
          <FieldLabel title="Date Format" />
          <ChipGroup options={DATE_FORMATS} value={v.dateFormat} onChange={(dateFormat) => setV({ ...v, dateFormat })} />
        </div>
        <div>
          <FieldLabel title="Time Format" />
          <ChipGroup options={TIME_FORMATS} value={v.timeFormat} onChange={(timeFormat) => setV({ ...v, timeFormat })} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}