"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check, Save, Loader2 } from "lucide-react";
import { primaryBtn, Toast, FieldLabel, SectionHeading, ChipGroup, Toggle } from "./shared";
import type { AppearanceSettings } from "@/services/settingsService";
import { applyAccentColor } from "@/lib/accentColor";
import { applyFontSize } from "@/lib/fontSize";
import { getErrorMessage } from "@/lib/errors";

const ACCENTS = [
  { name: "Amber", hex: "#F59E0B" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Emerald", hex: "#22C55E" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#8B5CF6" },
];

const FONT_SIZES = ["Small", "Medium", "Large"];

// `AppearanceSettings.theme` is the officially persisted field, but this
// component's local state also carries a `mode` alias in-memory (set
// alongside `theme` in handleThemeSelect below) — this type reflects that
// actual shape instead of casting through `any` at every read site.
type LocalAppearanceSettings = AppearanceSettings & { mode?: string };

export default function AppearanceSection({
  value,
  onSave,
}: {
  value: AppearanceSettings;
  onSave: (v: AppearanceSettings) => Promise<void>;
}) {
  const [v, setV] = useState<LocalAppearanceSettings>(value);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync internal state when incoming prop updates
  useEffect(() => {
    setV(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);

    // Persist to localStorage first — this should succeed and be remembered
    // even if the Supabase sync below fails (offline, transient error), since
    // the visual choice has already been applied live via handleThemeSelect
    // / the accent swatch onClick.
    const selectedTheme = v.theme || v.mode;
    if (selectedTheme) {
      localStorage.setItem("mentora_theme", selectedTheme);
      localStorage.setItem("theme", selectedTheme);
    }
    if (v.accentColor) {
      localStorage.setItem("accentColor", v.accentColor);
    }
    if (v.fontSize) {
      localStorage.setItem("fontSize", v.fontSize);
    }

    try {
      await onSave(v);

      // Sync root document theme if theme property exists on settings
      if (selectedTheme) {
        if (selectedTheme === "system") {
          const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", systemDark ? "dark" : "light");
        } else {
          document.documentElement.setAttribute("data-theme", selectedTheme);
        }
      }

      setMsg({ type: "success", text: "Appearance updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save appearance settings.") });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const currentTheme = v.theme || v.mode || "dark";

  const handleThemeSelect = (mode: string) => {
    setV((prev) => ({ ...prev, theme: mode, mode }));

    // Apply immediately for instant visual feedback (matching the dashboard
    // ThemeToggle's behavior) — Save Changes below still persists it to the
    // account so it's remembered across devices/sessions.
    const resolvedTheme =
      mode === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : mode;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem("theme", resolvedTheme);
  };

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle. Note: currentTheme (above)
  // is the user's in-progress selection in this form, kept separate from
  // the live applied theme — same as before.
  const cardContainerStyle: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid var(--theme-border)",
    paddingTop: "16px",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <SectionHeading
        title="Appearance"
        hint="Customize how Mentora looks and feels across your devices."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={cardContainerStyle}>
        {/* Theme Selection */}
        <div>
          <FieldLabel title="Theme Mode" hint="Select your preferred color theme." />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            {[
              { id: "dark", label: "Dark", Icon: Moon },
              { id: "light", label: "Light", Icon: Sun },
              { id: "system", label: "System", Icon: Monitor },
            ].map(({ id, label, Icon }) => {
              const isActive = currentTheme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleThemeSelect(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isActive
                      ? "2px solid var(--theme-accent)"
                      : "1px solid var(--theme-border)",
                    background: isActive
                      ? "var(--theme-accent-soft)"
                      : "var(--theme-hover-bg)",
                    color: isActive ? "var(--theme-accent)" : "var(--theme-text-sub)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Swatches */}
        <div style={dividerStyle}>
          <FieldLabel title="Accent Color" hint="Primary color used for highlights and buttons." />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
            {ACCENTS.map((acc) => {
              const isSelected = v.accentColor === acc.hex;
              return (
                <button
                  key={acc.hex}
                  type="button"
                  onClick={() => {
                    setV({ ...v, accentColor: acc.hex });
                    applyAccentColor(acc.hex);
                  }}
                  title={acc.name}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: acc.hex,
                    border: isSelected
                      ? "3px solid var(--theme-text-main)"
                      : "2px solid transparent",
                    outline: isSelected ? `2px solid ${acc.hex}` : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.15s ease",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {isSelected && <Check size={18} style={{ color: "#FFFFFF", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size Selector */}
        <div style={dividerStyle}>
          <FieldLabel title="Font Size" hint="Adjust text sizing across the application." />
          <ChipGroup
            options={FONT_SIZES}
            value={v.fontSize}
            onChange={(fontSize) => {
              setV({ ...v, fontSize });
              applyFontSize(fontSize);
            }}
          />
        </div>

        {/* Compact Mode Toggle */}
        <div style={dividerStyle}>
          <Toggle
            checked={v.compactMode}
            onChange={(compactMode) => setV({ ...v, compactMode })}
            label="Compact Mode"
            hint="Reduce spacing to display more content on screen."
          />
        </div>
      </div>

      {/* Action Button - Mobile Responsive */}
      <div style={{ marginTop: "24px" }}>
        <button
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