"use client";

import { FileText } from "lucide-react";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance",
    body: ["By using Mentora, you agree to these Terms."],
  },
  {
    title: "2. About Mentora",
    body: ["Mentora is a platform that helps learners discover and connect with mentors through online or offline sessions."],
  },
  {
    title: "3. User Accounts",
    body: [
      "Users agree to:",
      "• Provide accurate information",
      "• Keep login credentials secure",
      "• Be responsible for activities on their account",
    ],
  },
  {
    title: "4. Mentor Responsibilities",
    body: [
      "Mentors should:",
      "• Provide genuine guidance",
      "• Respect scheduled sessions",
      "• Maintain professional behavior",
    ],
  },
  {
    title: "5. Student Responsibilities",
    body: [
      "Students should:",
      "• Attend booked sessions on time",
      "• Respect mentors",
      "• Avoid abusive or inappropriate behavior",
    ],
  },
  {
    title: "6. Bookings & Payments",
    body: [
      "• Payments are processed through secure payment partners.",
      "• Refund and cancellation policies may vary depending on the mentor or platform policy.",
    ],
  },
  {
    title: "7. Cancellation Policy",
    body: ["Sessions may be cancelled according to Mentora's cancellation policy displayed during booking."],
  },
  {
    title: "8. Intellectual Property",
    body: ["All Mentora branding, logos, designs, and platform content belong to Mentora unless otherwise stated."],
  },
  {
    title: "9. Prohibited Activities",
    body: [
      "Users must not:",
      "• Harass others",
      "• Share illegal content",
      "• Attempt to hack the platform",
      "• Impersonate another person",
      "• Misuse mentor information",
    ],
  },
  {
    title: "10. Limitation of Liability",
    body: ["Mentora facilitates connections between mentors and learners. We do not guarantee educational outcomes or career results."],
  },
  {
    title: "11. Account Suspension",
    body: ["We reserve the right to suspend or terminate accounts that violate these Terms."],
  },
  {
    title: "12. Changes to Terms",
    body: ["These Terms may be updated periodically. Continued use of Mentora means you accept the latest version."],
  },
];

const CONTACT_EMAIL = "talibansari623278@gmail.com";

export default function TermsAndConditionsPage() {
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
            <FileText size={20} style={{ color: "var(--theme-accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--theme-text-main)" }}>
              Terms &amp; Conditions
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
              13. Contact
            </h2>
            <p style={{ color: "var(--theme-text-sub)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "6px" }}>
              For questions regarding these Terms:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Terms & Conditions Question")}`}
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