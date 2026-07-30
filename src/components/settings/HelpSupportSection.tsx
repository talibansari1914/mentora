"use client";

import { useState } from "react";
import { G, SectionHeading } from "./shared";

const SUPPORT_EMAIL = "support@mentora.app";

const FAQS = [
  {
    q: "How does Daily Practice generate questions?",
    a: "It uses AI to generate fresh MCQs for your chosen exam and subject each time — they're not pulled from a fixed bank, so no two sessions are exactly the same.",
  },
  {
    q: "Why do I need to set an exam date?",
    a: "It powers the countdown shown on your Study Planner. Set it in Preferences here or directly on the Planner page.",
  },
  {
    q: "How does the Memory Assistant decide when to show me a topic again?",
    a: "It uses the SM-2 spaced repetition algorithm — topics you find easy get spaced further apart, ones you find hard come back sooner.",
  },
  {
    q: "Can I change my exam after signing up?",
    a: "Yes — go to Settings → Profile and update it anytime. It controls which subjects show up across the app.",
  },
];

function mailLink(subject: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(subject)}`;
}

export default function HelpSupportSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const actionBtn: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,.1)",
    color: "#94A3B8",
    fontWeight: 700,
    fontSize: ".85rem",
    textDecoration: "none",
  };

  return (
    <div>
      <SectionHeading title="Help & Support" />

      <div style={{ marginBottom: "28px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "12px" }}>FAQs</h3>
        <div style={{ ...G.card, padding: "6px 18px" }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                padding: "14px 0",
                borderBottom: i < FAQS.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: ".9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                }}
              >
                {faq.q}
                <span style={{ color: "#F59E0B", marginLeft: "10px" }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <p style={{ color: "#94A3B8", fontSize: ".85rem", marginTop: "10px", lineHeight: 1.6 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a href={mailLink("Contact Support")} target="_blank" rel="noopener noreferrer" style={actionBtn}>
          Contact Support
        </a>
        <a href={mailLink("Bug Report")} target="_blank" rel="noopener noreferrer" style={actionBtn}>
          Report a Bug
        </a>
        <a href={mailLink("Feature Suggestion")} target="_blank" rel="noopener noreferrer" style={actionBtn}>
          Suggest a Feature
        </a>
      </div>
    </div>
  );
}