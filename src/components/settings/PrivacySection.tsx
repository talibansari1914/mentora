"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Download, LogOut, Trash2, Copy, Check, Mail, Loader2 } from "lucide-react";
import { inputStyle, primaryBtn, Toast, FieldLabel, SectionHeading } from "./shared";
import { authService } from "@/services/authService";
import { settingsService } from "@/services/settingsService";
import { Turnstile } from "@/components/auth/Turnstile";
import { getErrorMessage } from "@/lib/errors";

const SUPPORT_EMAIL = "talibansari623278@gmail.com";

export default function PrivacySection({ email }: { email: string }) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);

  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  async function handleUpdatePassword() {
    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
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
      // Verify the current password is correct before allowing the change —
      // signIn() re-checks the credentials against Supabase (and quietly
      // refreshes the session in the process) without sending any email/OTP,
      // unlike Supabase's built-in "require current password" setting.
      try {
        await authService.signIn(email, currentPassword, captchaToken);
      } catch {
        setPasswordMsg({ type: "error", text: "Current password is incorrect." });
        return;
      }

      await authService.updatePassword(newPassword);
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordMsg({ type: "error", text: getErrorMessage(err, "Could not update your password.") });
    } finally {
      setSavingPassword(false);
      // Turnstile tokens are single-use - clear it so a retry waits for a
      // fresh token from the widget.
      setCaptchaToken(undefined);
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
    } catch (err: unknown) {
      setExportMsg({ type: "error", text: getErrorMessage(err, "Could not export your data.") });
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
      // clipboard unavailable
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

  const btnSecondaryStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "transparent",
    border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.25))",
    color: "var(--theme-text-main, inherit)",
    padding: "11px 20px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    transition: "all 0.18s ease-out",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 480px) {
          .privacy-btn-full {
            max-width: 100% !important;
            width: 100% !important;
          }
          .danger-zone-buttons {
            flex-direction: column !important;
          }
          .danger-zone-buttons button,
          .danger-zone-buttons a {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Privacy & Security"
        hint="Manage your security credentials, export account data, or sign out."
      />

      {/* User Email & Account Info */}
      <div style={cardContainerStyle}>
        <div>
          <FieldLabel title="Account Email" hint="Your primary login email. Contact support to change this." />
          <input
            value={email}
            disabled
            style={{
              ...inputStyle,
              opacity: 0.7,
              cursor: "not-allowed",
              background: "var(--theme-hover-bg, rgba(150, 150, 150, 0.05))",
            }}
          />
        </div>
      </div>

      {/* Change Password Block */}
      <SectionHeading title="Security" />
      <div style={cardContainerStyle}>
        {passwordMsg && <Toast message={passwordMsg.text} type={passwordMsg.type} />}

        <div>
          <FieldLabel title="Current Password" />
          <input
            type="password"
            value={currentPassword}
            placeholder="••••••••"
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <FieldLabel title="New Password" hint="Must be at least 8 characters long." />
          <input
            type="password"
            value={newPassword}
            placeholder="••••••••"
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <FieldLabel title="Confirm New Password" />
          <input
            type="password"
            value={confirmPassword}
            placeholder="••••••••"
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(undefined)}
          />
        )}

        <div>
          <button
            className="privacy-btn-full"
            onClick={handleUpdatePassword}
            disabled={savingPassword}
            style={{
              ...primaryBtn(savingPassword),
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
              cursor: savingPassword ? "not-allowed" : "pointer",
            }}
          >
            {savingPassword ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Data Export & Session Management */}
      <SectionHeading title="Data & Sessions" />
      <div style={cardContainerStyle}>
        {/* Download Data */}
        <div>
          <h4 style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "6px", color: "var(--theme-text-main, inherit)" }}>
            Download My Data
          </h4>
          <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.82rem", marginBottom: "14px", lineHeight: 1.5 }}>
            Download a JSON export containing your profile, settings, test history, planner tasks, and revision items.
          </p>
          {exportMsg && <Toast message={exportMsg.text} type={exportMsg.type} />}
          <button
            className="privacy-btn-full"
            onClick={handleExportData}
            disabled={exporting}
            style={{
              ...btnSecondaryStyle,
              opacity: exporting ? 0.6 : 1,
              cursor: exporting ? "not-allowed" : "pointer",
            }}
          >
            {exporting ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <Download size={16} style={{ flexShrink: 0 }} />
                <span>Download My Data</span>
              </>
            )}
          </button>
        </div>

        {/* Sign Out */}
        <div style={{ borderTop: "1px solid var(--theme-border, rgba(150, 150, 150, 0.15))", paddingTop: "16px" }}>
          <h4 style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "6px", color: "var(--theme-text-main, inherit)" }}>
            Sign Out
          </h4>
          <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.82rem", marginBottom: "14px" }}>
            Sign out of Mentora on this device.
          </p>
          <button
            className="privacy-btn-full"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              ...btnSecondaryStyle,
              opacity: signingOut ? 0.6 : 1,
              cursor: signingOut ? "not-allowed" : "pointer",
            }}
          >
            {signingOut ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut size={16} style={{ flexShrink: 0 }} />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div
        style={{
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "14px",
          padding: "20px",
          marginTop: "24px",
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#EF4444",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.98rem",
          }}
        >
          <Trash2 size={18} style={{ flexShrink: 0 }} />
          <span>Delete Account</span>
        </h3>
        <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "16px" }}>
          This permanently deletes your account, study history, and all saved data. This action cannot be undone. Account deletion is handled by our support team to keep your data secure.
        </p>
        <div className="danger-zone-buttons" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleCopyEmail}
            style={{
              background: "transparent",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: copiedEmail ? "#22C55E" : "#EF4444",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.18s ease-out",
            }}
          >
            {copiedEmail ? (
              <>
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>Copied {SUPPORT_EMAIL}</span>
              </>
            ) : (
              <>
                <Copy size={16} style={{ flexShrink: 0 }} />
                <span>Copy Support Email</span>
              </>
            )}
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my account")}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.25))",
              color: "var(--theme-text-main, inherit)",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.85rem",
              textDecoration: "none",
              transition: "all 0.18s ease-out",
            }}
          >
            <Mail size={16} style={{ flexShrink: 0 }} />
            <span>Send Mail Request →</span>
          </a>
        </div>
      </div>
    </div>
  );
}