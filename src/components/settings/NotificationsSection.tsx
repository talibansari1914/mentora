"use client";

import { useState } from "react";
import { primaryBtn, Toast, SectionHeading, Toggle } from "./shared";
import type { NotificationSettings } from "@/services/settingsService";

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

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(v);
      setMsg({ type: "success", text: "Notification preferences updated." });
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
        title="Notifications"
        hint="These save your preference. Actual push/email delivery isn't wired up yet — this just remembers what you want once it is."
      />
      {msg && <Toast message={msg.text} type={msg.type} />}

      <div style={{ marginBottom: "24px" }}>
        <Toggle checked={v.dailyReminder} onChange={(dailyReminder) => setV({ ...v, dailyReminder })} label="Daily Study Reminder" />
        <Toggle checked={v.mockTestReminder} onChange={(mockTestReminder) => setV({ ...v, mockTestReminder })} label="Mock Test Reminder" />
        <Toggle checked={v.assignmentReminder} onChange={(assignmentReminder) => setV({ ...v, assignmentReminder })} label="Assignment / Task Reminder" />
        <Toggle checked={v.revisionReminder} onChange={(revisionReminder) => setV({ ...v, revisionReminder })} label="Revision Reminder" />
        <Toggle checked={v.achievementNotifications} onChange={(achievementNotifications) => setV({ ...v, achievementNotifications })} label="Achievement Notifications" />
        <Toggle checked={v.emailNotifications} onChange={(emailNotifications) => setV({ ...v, emailNotifications })} label="Email Notifications" />
        <Toggle checked={v.pushNotifications} onChange={(pushNotifications) => setV({ ...v, pushNotifications })} label="Push Notifications" />
      </div>

      <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}