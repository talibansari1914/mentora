"use client";

import { Lock } from "lucide-react";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Introduction",
    body: [
      "Welcome to Mentora. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect:",
      "• Name",
      "• Email Address",
      "• Phone Number (optional)",
      "• Profile Photo",
      "• Mentor/Student Profile Information",
      "• Booking History",
      "• Payment Status (we never store your card details)",
      "• Device Information",
      "• Usage Analytics",
    ],
  },
  {
    title: "3. How We Use Your Information",
    body: [
      "We use your information to:",
      "• Create your account",
      "• Connect students with mentors",
      "• Manage bookings",
      "• Improve our platform",
      "• Send important notifications",
      "• Provide customer support",
    ],
  },
  {
    title: "4. Data Security",
    body: [
      "We take reasonable security measures to protect your data. However, no online platform can guarantee 100% security.",
    ],
  },
  {
    title: "5. Third-Party Services",
    body: [
      "Mentora may use trusted third-party services such as:",
      "• Authentication",
      "• Payment Gateway",
      "• Cloud Storage",
      "• Analytics",
      "These providers have their own privacy policies.",
    ],
  },
  {
    title: "6. Cookies",
    body: ["We may use cookies to improve your experience and remember your preferences."],
  },
  {
    title: "7. Your Rights",
    body: [
      "You can:",
      "• Update your profile",
      "• Delete your account",
      "• Request removal of your data",
      "• Contact us for privacy concerns",
    ],
  },
  {
    title: "8. Children's Privacy",
    body: ["Mentora is intended for users aged 13 years or above."],
  },
  {
    title: "9. Changes",
    body: ["We may update this Privacy Policy from time to time. Changes will be reflected on this page."],
  },
];

const CONTACT_EMAIL = "talibansari623278@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--theme-bg-main)",
        color: "var(--theme-text-main)",
        fontFamily: "'DM Sans', sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <BackToDashboardLink href="/settings" label="Back to Settings" />
        </div>

        <header style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "var(--theme-accent-soft)",
              border: "1px solid var(--theme-accent-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Lock size={20} style={{ color: "var(--theme-accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--theme-text-main)" }}>
              Privacy Policy
            </h1>
            <p style={{ color: "var(--theme-text-sub)", fontSize: "0.82rem", marginTop: "2px" }}>
              Last updated: August 2026 · Mentora (MVP)
            </p>
          </div>
        </header>

        <div
          style={{
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "18px",
            padding: "clamp(20px, 4vw, 32px)",
            boxSizing: "border-box",
          }}
        >
          {SECTIONS.map((section, i) => (
            <div
              key={section.title}
              style={{
                marginBottom: i < SECTIONS.length - 1 ? "24px" : 0,
                paddingBottom: i < SECTIONS.length - 1 ? "24px" : 0,
                borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--theme-border)" : "none",
              }}
            >
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "10px" }}>
                {section.title}
              </h2>
              {section.body.map((line, j) => (
                <p
                  key={j}
                  style={{
                    color: "var(--theme-text-sub)",
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    margin: line.startsWith("•") ? "2px 0 2px 4px" : "0 0 6px 0",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}

          {/* Contact */}
          <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--theme-border)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "10px" }}>
              10. Contact
            </h2>
            <p style={{ color: "var(--theme-text-sub)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "6px" }}>
              For privacy-related questions:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Privacy Policy Question")}`}
              style={{ color: "var(--theme-accent)", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}