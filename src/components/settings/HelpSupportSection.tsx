"use client";

import { useState } from "react";
import { ChevronDown, Mail, Bug, Lightbulb, HelpCircle } from "lucide-react";
import { G, SectionHeading } from "./shared";

const SUPPORT_EMAIL = "talibansari623278@gmail.com";

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
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export default function HelpSupportSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const actionBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.2))",
    background: "var(--theme-card-bg, var(--card-bg, transparent))",
    color: "var(--theme-text-main, inherit)",
    fontWeight: 600,
    fontSize: "0.85rem",
    textDecoration: "none",
    transition: "all 0.18s ease-out",
    flex: "1 1 100%",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (min-width: 640px) {
          .help-action-buttons {
            flex-direction: row !important;
          }
          .help-action-btn {
            flex: 1 1 180px !important;
          }
        }
      `}</style>

      <SectionHeading
        title="Help & Support"
        hint="Find answers to common questions or reach out directly to our team."
      />

      {/* FAQ Section */}
      <div style={{ marginBottom: "28px" }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "12px",
            color: "var(--theme-text-main, inherit)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <HelpCircle size={18} style={{ color: "var(--theme-accent, #3B82F6)", flexShrink: 0 }} />
          <span>Frequently Asked Questions</span>
        </h3>

        <div
          style={{
            ...G.card,
            background: "var(--theme-card-bg, var(--card-bg, transparent))",
            border: "1px solid var(--theme-border, rgba(150, 150, 150, 0.2))",
            borderRadius: "14px",
            padding: "8px 18px",
          }}
        >
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    i < FAQS.length - 1
                      ? "1px solid var(--theme-border, rgba(150, 150, 150, 0.15))"
                      : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "transparent",
                    border: "none",
                    color: "var(--theme-text-main, inherit)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    gap: "12px",
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: isOpen ? "var(--theme-accent, #3B82F6)" : "var(--theme-text-sub, inherit)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <p
                    style={{
                      color: "var(--theme-text-sub, inherit)",
                      opacity: 0.85,
                      fontSize: "0.84rem",
                      marginTop: "10px",
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Links */}
      <div
        className="help-action-buttons"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
        }}
      >
        <a href={mailLink("Contact Support")} className="help-action-btn" style={actionBtnStyle}>
          <Mail size={16} style={{ color: "#3B82F6", flexShrink: 0 }} />
          <span>Contact Support</span>
        </a>
        <a href={mailLink("Bug Report")} className="help-action-btn" style={actionBtnStyle}>
          <Bug size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
          <span>Report a Bug</span>
        </a>
        <a href={mailLink("Feature Suggestion")} className="help-action-btn" style={actionBtnStyle}>
          <Lightbulb size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <span>Suggest a Feature</span>
        </a>
      </div>
    </div>
  );
}