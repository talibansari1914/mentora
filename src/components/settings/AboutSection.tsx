"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Check, ExternalLink, Shield, FileText, Info } from "lucide-react";
import { G, SectionHeading } from "./shared";

export default function AboutSection() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "";

    // Use the Web Share API on mobile devices when it's available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Mentora – AI Powered Smart Learning",
          text: "Notes, Books, PYQs and Mock Tests in one place. Powered by AI!",
          url: url,
        });
        return;
      } catch {
        // User ne cancel kiya toh standard clipboard copy fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  // UI now reads directly from the global CSS variables (globals.css)
  // that the dashboard's ThemeToggle sets via data-theme on <html>.
  // No local isDark state, no localStorage polling, no interval —
  // it stays perfectly in sync and reacts instantly to the toggle.
  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid var(--theme-border)",
    gap: "12px",
    flexWrap: "wrap",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.88rem",
    fontWeight: 500,
    color: "var(--theme-text-main)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--theme-accent)",
    fontSize: "0.82rem",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: 600,
    transition: "opacity 0.2s ease",
  };

  return (
    <div style={{ width: "100%" }}>
      <SectionHeading title="About" />

      {/* Main Info Card */}
      <div
        style={{
          ...G.card,
          background: "var(--theme-card-bg)",
          border: "1px solid var(--theme-border)",
          borderRadius: "14px",
          padding: "6px 18px",
          marginBottom: "20px",
        }}
      >
        {/* App Version Row */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <Info size={16} style={{ color: "var(--theme-text-sub)" }} />
            <span>App Version</span>
          </div>
          <span
            style={{
              color: "var(--theme-text-sub)",
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "var(--theme-hover-bg)",
              padding: "2px 8px",
              borderRadius: "6px",
              border: "1px solid var(--theme-border)",
            }}
          >
            1.0.0
          </span>
        </div>

        {/* Privacy Policy Row */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <Shield size={16} style={{ color: "var(--theme-text-sub)" }} />
            <span>Privacy Policy</span>
          </div>
          <Link href="/privacy" style={linkStyle}>
            Privacy Policy <ExternalLink size={13} />
          </Link>
        </div>

        {/* Terms & Conditions Row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={labelStyle}>
            <FileText size={16} style={{ color: "var(--theme-text-sub)" }} />
            <span>Terms & Conditions</span>
          </div>
          <Link href="/terms" style={linkStyle}>
            Terms & Conditions <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Action Button - Mobile Responsive */}
      <button
        onClick={handleShare}
        style={{
          background: G.grad || "linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent) 100%)",
          border: "none",
          color: "var(--theme-accent-text)",
          padding: "11px 22px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "0.88rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          maxWidth: "220px",
          boxShadow: "0 4px 12px var(--theme-accent-glow)",
          transition: "transform 0.15s ease, opacity 0.2s ease",
        }}
      >
        {copied ? (
          <>
            <Check size={16} />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <Share2 size={16} />
            <span>Share Mentora</span>
          </>
        )}
      </button>
    </div>
  );
}