"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup } from "./shared";
import type { LanguageRegionSettings } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

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

  // Sync state if external prop changes
  useEffect(() => {
    setV(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Language & region updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save settings.") });
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
          .lang-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Language & Region"
        hint="App Language changes menus and buttons once translations are added."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={cardContainerStyle}>
        {/* App Language */}
        <div>
          <FieldLabel title="App Language" hint="Interface text language." />
          <ChipGroup
            options={APP_LANGUAGES}
            value={v.appLanguage}
            onChange={(appLanguage) => setV({ ...v, appLanguage })}
          />
        </div>

        {/* Content Language */}
        <div style={dividerStyle}>
          <FieldLabel title="Content Language" hint="Used by Notes Generator and Daily Practice. (AI Mentor has its own setting under the AI Mentor tab.)" />
          <ChipGroup
            options={CONTENT_LANGUAGES}
            value={v.contentLanguage}
            onChange={(contentLanguage) => setV({ ...v, contentLanguage })}
          />
        </div>

        {/* Date & Time Formats - Mobile Responsive Grid */}
        <div
          style={{
            ...dividerStyle,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <FieldLabel title="Date Format" />
            <ChipGroup
              options={DATE_FORMATS}
              value={v.dateFormat}
              onChange={(dateFormat) => setV({ ...v, dateFormat })}
            />
          </div>

          <div>
            <FieldLabel title="Time Format" />
            <ChipGroup
              options={TIME_FORMATS}
              value={v.timeFormat}
              onChange={(timeFormat) => setV({ ...v, timeFormat })}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="lang-save-btn"
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