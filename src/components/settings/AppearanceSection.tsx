"use client";

import { useState } from "react";
import { G, primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { AppearanceSettings } from "@/services/settingsService";

const ACCENTS = ["#F59E0B", "#3B82F6", "#22C55E", "#EC4899", "#8B5CF6"];
const FONT_SIZES = ["Small", "Medium", "Large"];

export default function AppearanceSection({
  value,
  onSave,
}: {
  value: AppearanceSettings;
  onSave: (v: AppearanceSettings) => Promise<void>;
}) {
  const [v, setV] = useState<AppearanceSettings>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Appearance updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message ?? "Could not save." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div>
      <SectionHeading title="Appearance" />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Theme" hint="Light mode is coming soon — Mentora is dark-only for now." />
        <div style={{ display: "flex", gap: "8px" }}>
          <span
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              background: G.grad,
              color: "#111827",
              fontWeight: 700,
              fontSize: ".8rem",
            }}
          >
            Dark
          </span>
          <span
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,.08)",
              color: "#475569",
              fontWeight: 700,
              fontSize: ".8rem",
            }}
          >
            Light (coming soon)
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Accent Color" />
        <div style={{ display: "flex", gap: "10px" }}>
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setV({ ...v, accentColor: c })}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: c,
                border: v.accentColor === c ? "3px solid white" : "3px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <FieldLabel title="Font Size" />
        <ChipGroup options={FONT_SIZES} value={v.fontSize} onChange={(fontSize) => setV({ ...v, fontSize })} />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <Toggle
          checked={v.compactMode}
          onChange={(compactMode) => setV({ ...v, compactMode })}
          label="Compact Mode"
          hint="Reduce spacing to fit more content on screen."
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}