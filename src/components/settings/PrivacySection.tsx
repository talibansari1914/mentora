"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { G, inputStyle, primaryBtn, Toast, FieldLabel, SectionHeading } from "./shared";
import { authService } from "@/services/authService";
import { settingsService } from "@/services/settingsService";

const SUPPORT_EMAIL = "support@mentora.app";

export default function PrivacySection({ email }: { email: string }) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  async function handleUpdatePassword() {
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg(null);

    try {
      await authService.updatePassword(newPassword);
      setPasswordMsg({ type: "success", text: "Password updated." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message ?? "Could not update your password." });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authService.signOut();
      router.push("/login");
    } catch {
      setSigningOut(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    setExportMsg(null);
    try {
      const data = await settingsService.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mentora-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg({ type: "success", text: "Your data has been downloaded." });
    } catch (err: any) {
      setExportMsg({ type: "error", text: err.message ?? "Could not export your data." });
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(null), 3000);
    }
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  return (
    <div>
      <SectionHeading title="Privacy & Security" />

      <div style={{ marginBottom: "26px" }}>
        <FieldLabel title="Email" hint="Your login email — contact support to change this." />
        <input value={email} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "14px" }}>Change Password</h3>

        {passwordMsg && <Toast message={passwordMsg.text} type={passwordMsg.type} />}

        <div style={{ marginBottom: "14px" }}>
          <FieldLabel title="New Password" hint="At least 8 characters." />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: "18px" }}>
          <FieldLabel title="Confirm New Password" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button onClick={handleUpdatePassword} disabled={savingPassword} style={primaryBtn(savingPassword)}>
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "10px" }}>Download My Data</h3>
        <p style={{ color: "#64748B", fontSize: ".82rem", marginBottom: "14px" }}>
          Get a JSON file with your profile, settings, test results, tasks, and revision items.
        </p>
        {exportMsg && <Toast message={exportMsg.text} type={exportMsg.type} />}
        <button
          onClick={handleExportData}
          disabled={exporting}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,.1)",
            color: "white",
            padding: "11px 22px",
            borderRadius: "10px",
            cursor: exporting ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: ".88rem",
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? "Preparing..." : "Download My Data"}
        </button>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "10px" }}>Sign Out</h3>
        <p style={{ color: "#64748B", fontSize: ".82rem", marginBottom: "14px" }}>Sign out of Mentora on this device.</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,.1)",
            color: "white",
            padding: "11px 22px",
            borderRadius: "10px",
            cursor: signingOut ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: ".88rem",
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      <div
        style={{
          background: "rgba(239,68,68,.06)",
          border: "1px solid rgba(239,68,68,.2)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3 style={{ fontWeight: 700, color: "#EF4444", marginBottom: "8px" }}>Delete Account</h3>
        <p style={{ color: "#94A3B8", fontSize: ".85rem", lineHeight: 1.6, marginBottom: "16px" }}>
          This permanently deletes your account, study history, and all saved data. This action can't be undone.
          Account deletion is handled by our support team to keep it secure.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleCopyEmail}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,.4)",
              color: copiedEmail ? "#22C55E" : "#EF4444",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: ".85rem",
              cursor: "pointer",
            }}
          >
            {copiedEmail ? "✓ Copied support@mentora.app" : "Copy Support Email"}
          </button>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent("Delete my account")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "transparent",
              border: "1px solid rgba(255,255,255,.1)",
              color: "#94A3B8",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: ".85rem",
              textDecoration: "none",
            }}
          >
            Open in Gmail →
          </a>
        </div>
      </div>
    </div>
  );
}