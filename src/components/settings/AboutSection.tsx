"use client";

import { useState } from "react";
import { G, SectionHeading } from "./shared";

export default function AboutSection() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,.06)",
  };

  return (
    <div>
      <SectionHeading title="About" />

      <div style={{ ...G.card, padding: "6px 18px", marginBottom: "20px" }}>
        <div style={rowStyle}>
          <span style={{ fontSize: ".88rem" }}>App Version</span>
          <span style={{ color: "#64748B", fontSize: ".82rem" }}>1.0.0</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: ".88rem" }}>Privacy Policy</span>
          <span style={{ color: "#64748B", fontSize: ".82rem" }}>Coming soon</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ fontSize: ".88rem" }}>Terms & Conditions</span>
          <span style={{ color: "#64748B", fontSize: ".82rem" }}>Coming soon</span>
        </div>
      </div>

      <button
        onClick={handleShare}
        style={{
          background: G.grad,
          border: "none",
          color: "#111827",
          padding: "11px 22px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: ".88rem",
        }}
      >
        {copied ? "✓ Link Copied" : "Share Mentora"}
      </button>
    </div>
  );
}