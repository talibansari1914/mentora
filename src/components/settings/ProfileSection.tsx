"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { G, inputStyle, primaryBtn, Toast, FieldLabel, SectionHeading } from "./shared";
import type { ProfileExtra } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

const EXAMS = ["UPSC", "JEE", "NEET", "SSC", "Banking", "Engineering", "GATE", "CAT"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export interface ProfileSectionProps {
  email: string;
  fullName: string;
  firstName: string;
  exam: string;
  extra: ProfileExtra;
  onSave: (
    basic: { full_name: string; first_name: string; exam: string },
    extra: ProfileExtra
  ) => Promise<void>;
}

export default function ProfileSection({ email, fullName, firstName, exam, extra, onSave }: ProfileSectionProps) {
  const [fName, setFName] = useState(fullName);
  const [firstN, setFirstN] = useState(firstName);
  const [ex, setEx] = useState(exam);
  const [ext, setExt] = useState<ProfileExtra>(extra);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state if external props change
  useEffect(() => {
    setFName(fullName);
    setFirstN(firstName);
    setEx(exam);
    setExt(extra);
  }, [fullName, firstName, exam, extra]);

  async function handleSave() {
    if (!fName.trim() || !firstN.trim()) {
      setMsg({ type: "error", text: "Name fields cannot be empty." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ full_name: fName.trim(), first_name: firstN.trim(), exam: ex }, ext);
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: getErrorMessage(err, "Could not save your profile.") });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  // Reads the same global CSS variables defined in globals.css — no local
  // redefinition here, so this component can never drift from (or override)
  // the dashboard's actual theme values.
  const cardStyle: React.CSSProperties = {
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

  const responsiveGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  };

  const dynamicInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: "var(--theme-hover-bg, var(--theme-input-bg, #F8FAFC))",
    color: "var(--theme-text-main)",
    borderColor: "var(--theme-border)",
  };

  const selectOptionStyle: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    color: "var(--theme-text-main)",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        input::placeholder, textarea::placeholder {
          color: var(--theme-text-sub);
          opacity: 1;
        }

        select {
          background-color: var(--theme-hover-bg, var(--theme-input-bg, #F8FAFC)) !important;
          color: var(--theme-text-main) !important;
        }

        @media (max-width: 480px) {
          .profile-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Profile Header Card */}
      <div
        style={{
          ...cardStyle,
          flexDirection: "row",
          alignItems: "center",
          gap: "18px",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: G.grad,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            fontWeight: 800,
            color: "#111827",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          }}
        >
          {initialsOf(fName || "Student")}
        </div>
        <div style={{ overflow: "hidden" }}>
          <h3
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--theme-text-main)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
              marginBottom: "4px",
            }}
          >
            {fName || "Student"}
          </h3>
          <p
            style={{
              color: "var(--theme-text-sub)",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
          >
            {email}
          </p>
        </div>
      </div>

      {msg && <Toast message={msg.text} type={msg.type} />}

      {/* Basic Info Section */}
      <SectionHeading title="Basic Info" hint="Personal details used across your account." />
      <div style={cardStyle}>
        <div style={responsiveGridStyle}>
          <div>
            <FieldLabel title="First Name" />
            <input value={firstN} onChange={(e) => setFirstN(e.target.value)} style={dynamicInputStyle} />
          </div>
          <div>
            <FieldLabel title="Full Name" />
            <input value={fName} onChange={(e) => setFName(e.target.value)} style={dynamicInputStyle} />
          </div>
        </div>

        <div style={responsiveGridStyle}>
          <div>
            <FieldLabel title="Username" />
            <input
              value={ext.username}
              onChange={(e) => setExt({ ...ext, username: e.target.value })}
              placeholder="e.g. rahul_upsc27"
              style={dynamicInputStyle}
            />
          </div>
          <div>
            <FieldLabel title="Mobile Number" />
            <input
              value={ext.mobile}
              onChange={(e) => setExt({ ...ext, mobile: e.target.value })}
              placeholder="+91 9xxxxxxxxx"
              style={dynamicInputStyle}
            />
          </div>
        </div>

        <div style={responsiveGridStyle}>
          <div>
            <FieldLabel title="Date of Birth" />
            <input
              type="date"
              value={ext.dob}
              onChange={(e) => setExt({ ...ext, dob: e.target.value })}
              style={dynamicInputStyle}
            />
          </div>
          <div>
            <FieldLabel title="Gender" hint="Optional" />
            <select
              value={ext.gender}
              onChange={(e) => setExt({ ...ext, gender: e.target.value })}
              style={dynamicInputStyle}
            >
              <option value="" style={selectOptionStyle}>
                Prefer not to say
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g} style={selectOptionStyle}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel title="Bio" />
          <textarea
            value={ext.bio}
            onChange={(e) => setExt({ ...ext, bio: e.target.value })}
            rows={3}
            placeholder="A short line about yourself..."
            style={{ ...dynamicInputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      {/* Location & Timezone Section */}
      <SectionHeading title="Location & Preferences" />
      <div style={cardStyle}>
        <div style={responsiveGridStyle}>
          <div>
            <FieldLabel title="Country" />
            <input
              value={ext.country}
              onChange={(e) => setExt({ ...ext, country: e.target.value })}
              style={dynamicInputStyle}
            />
          </div>
          <div>
            <FieldLabel title="Time Zone" />
            <input
              value={ext.timezone}
              onChange={(e) => setExt({ ...ext, timezone: e.target.value })}
              style={dynamicInputStyle}
            />
          </div>
        </div>
      </div>

      {/* Target Exam Section */}
      <SectionHeading title="Target Exam" hint="This decides which subjects and content you'll see across the app." />
      <div style={cardStyle}>
        <div>
          <FieldLabel title="Select Exam" />
          <select value={ex} onChange={(e) => setEx(e.target.value)} style={dynamicInputStyle}>
            {EXAMS.map((e) => (
              <option key={e} value={e} style={selectOptionStyle}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="profile-save-btn"
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