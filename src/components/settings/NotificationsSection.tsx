"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { primaryBtn, Toast, SectionHeading, Toggle } from "./shared";
import type { NotificationSettings } from "@/services/settingsService";
import { getErrorMessage } from "@/lib/errors";

export default function NotificationsSection({
  value,
  onSave,
}: {
  value: NotificationSettings;
  onSave: (v: NotificationSettings) => Promise<void>;
}) {
  const [v, setV] = useState<NotificationSettings>(value);
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
      setMsg({ type: "success", text: "Notification preferences updated." });
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
          .notif-save-btn {
            max-width: 100% !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Notifications"
        hint="These save your preference. Actual push/email delivery isn't wired up yet — this just remembers what you want once it is."
      />

      {msg && <Toast message={msg.text} type={msg.type} />}

      {/* Study & Activity Alerts */}
      <SectionHeading title="Study & Activity Alerts" />
      <div style={cardContainerStyle}>
        <Toggle
          checked={v.dailyReminder}
          onChange={(dailyReminder) => setV({ ...v, dailyReminder })}
          label="Daily Study Reminder"
          hint="Get daily notifications to stay consistent with your goals."
        />

        <div style={dividerStyle}>
          <Toggle
            checked={v.mockTestReminder}
            onChange={(mockTestReminder) => setV({ ...v, mockTestReminder })}
            label="Mock Test Reminder"
            hint="Nudges for upcoming and scheduled practice tests."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.assignmentReminder}
            onChange={(assignmentReminder) => setV({ ...v, assignmentReminder })}
            label="Assignment / Task Reminder"
            hint="Alerts for pending tasks and study goals."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.revisionReminder}
            onChange={(revisionReminder) => setV({ ...v, revisionReminder })}
            label="Revision Reminder"
            hint="Reminders powered by Memory Assistant spaced repetition."
          />
        </div>

        <div style={dividerStyle}>
          <Toggle
            checked={v.achievementNotifications}
            onChange={(achievementNotifications) => setV({ ...v, achievementNotifications })}
            label="Achievement Notifications"
            hint="Alerts when you unlock badges, streaks, or test milestones."
          />
        </div>
      </div>

      {/* Delivery Channels */}
      <SectionHeading title="Delivery Channels" />
      <div style={cardContainerStyle}>
        <Toggle
          checked={v.emailNotifications}
          onChange={(emailNotifications) => setV({ ...v, emailNotifications })}
          label="Email Notifications"
          hint="Receive summary digests and critical study updates via email."
        />

        <div style={dividerStyle}>
          <Toggle
            checked={v.pushNotifications}
            onChange={(pushNotifications) => setV({ ...v, pushNotifications })}
            label="Push Notifications"
            hint="Receive instant alerts directly on your browser or device."
          />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: "24px", width: "100%" }}>
        <button
          className="notif-save-btn"
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