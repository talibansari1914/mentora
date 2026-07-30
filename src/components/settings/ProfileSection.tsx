"use client";

import { useState } from "react";
import { G, inputStyle, primaryBtn, Toast, FieldLabel, SectionHeading } from "./shared";
import type { ProfileExtra } from "@/services/settingsService";

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

  async function handleSave() {
    if (!fName.trim() || !firstN.trim()) {
      setMsg({ type: "error", text: "Name fields cannot be empty." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ full_name: fName.trim(), first_name: firstN.trim(), exam: ex }, ext);
      setMsg({ type: "success", text: "Profile updated." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message ?? "Could not save your profile." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
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
          }}
        >
          {initialsOf(fName || "Student")}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{fName || "Student"}</p>
          <p style={{ color: "#64748B", fontSize: ".82rem" }}>{email}</p>
        </div>
      </div>

      {msg && <Toast message={msg.text} type={msg.type} />}

      <SectionHeading title="Basic Info" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
        <div>
          <FieldLabel title="First Name" />
          <input value={firstN} onChange={(e) => setFirstN(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel title="Full Name" />
          <input value={fName} onChange={(e) => setFName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel title="Username" />
          <input
            value={ext.username}
            onChange={(e) => setExt({ ...ext, username: e.target.value })}
            placeholder="e.g. rahul_upsc27"
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel title="Mobile Number" />
          <input
            value={ext.mobile}
            onChange={(e) => setExt({ ...ext, mobile: e.target.value })}
            placeholder="+91 9xxxxxxxxx"
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel title="Date of Birth" />
          <input
            type="date"
            value={ext.dob}
            onChange={(e) => setExt({ ...ext, dob: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel title="Gender" hint="Optional" />
          <select value={ext.gender} onChange={(e) => setExt({ ...ext, gender: e.target.value })} style={inputStyle}>
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <FieldLabel title="Bio" />
        <textarea
          value={ext.bio}
          onChange={(e) => setExt({ ...ext, bio: e.target.value })}
          rows={3}
          placeholder="A short line about yourself..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div>
          <FieldLabel title="Country" />
          <input value={ext.country} onChange={(e) => setExt({ ...ext, country: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <FieldLabel title="Time Zone" />
          <input
            value={ext.timezone}
            onChange={(e) => setExt({ ...ext, timezone: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <SectionHeading title="Exam" hint="This decides which subjects and content you'll see across the app." />
      <div style={{ marginBottom: "24px" }}>
        <select value={ex} onChange={(e) => setEx(e.target.value)} style={inputStyle}>
          {EXAMS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}