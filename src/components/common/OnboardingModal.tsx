"use client";

// ============================================================================
// src/components/common/OnboardingModal.tsx
//
// Two-step first-run modal:
//   1. Terms & Conditions — must be checked + confirmed before continuing.
//   2. Feature tour — a short carousel introducing the app's main features,
//      written in English and Hindi together (not a language toggle).
//
// Self-contained: on mount it checks the logged-in user's saved settings
// (profile_extra.termsAcceptedAt / onboardingCompletedAt) and only renders
// itself if either step hasn't been completed yet. Drop <OnboardingModal />
// once into the dashboard page — no other wiring needed. Progress is saved
// to Supabase (not localStorage), so it won't re-appear on a new device.
// ============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { settingsService } from "@/services/settingsService";

type Phase = "loading" | "hidden" | "terms" | "tour";

const FEATURES: { icon: string; titleEn: string; titleHi: string; descEn: string; descHi: string }[] = [
  {
    icon: "🤖",
    titleEn: "AI Mentor",
    titleHi: "AI मेंटर",
    descEn: "Ask any doubt, anytime — get instant, step-by-step explanations.",
    descHi: "कभी भी कोई भी डाउट पूछें — तुरंत, स्टेप-बाय-स्टेप समझाया जाएगा।",
  },
  {
    icon: "📝",
    titleEn: "Notes Generator",
    titleHi: "नोट्स जनरेटर",
    descEn: "Turn any topic into clean, organized notes in seconds.",
    descHi: "किसी भी टॉपिक के साफ-सुथरे नोट्स सेकंडों में बनाएं।",
  },
  {
    icon: "🧪",
    titleEn: "Mock Tests & PYQs",
    titleHi: "मॉक टेस्ट और PYQs",
    descEn: "Practice with timed tests and previous year questions.",
    descHi: "टाइम्ड टेस्ट और पिछले वर्षों के प्रश्नों से अभ्यास करें।",
  },
  {
    icon: "🗓️",
    titleEn: "Study Planner",
    titleHi: "स्टडी प्लानर",
    descEn: "Build a daily schedule and track what's left to cover.",
    descHi: "अपना डेली शेड्यूल बनाएं और बचे हुए टॉपिक्स ट्रैक करें।",
  },
  {
    icon: "🧠",
    titleEn: "Memory & Revision",
    titleHi: "मेमोरी और रिवीजन",
    descEn: "Spaced-repetition flashcards so nothing you learn fades away.",
    descHi: "स्पेस्ड-रिपिटिशन फ्लैशकार्ड्स से जो पढ़ा है वो भूलेंगे नहीं।",
  },
  {
    icon: "🧑‍🏫",
    titleEn: "Mentor Booking",
    titleHi: "मेंटर बुकिंग",
    descEn: "Book 1-on-1 sessions with real academic, skill, and career mentors — online or offline.",
    descHi: "असली मेंटर्स के साथ 1-on-1 सेशन बुक करें — पढ़ाई, स्किल्स या करियर के लिए, ऑनलाइन या ऑफलाइन।",
  },
  {
    icon: "📚",
    titleEn: "Library",
    titleHi: "लाइब्रेरी",
    descEn: "Read books, PYQ compilations, and magazines for your exam, and track your reading progress.",
    descHi: "अपने एग्जाम की किताबें, PYQ कलेक्शन और मैगज़ीन पढ़ें, और अपनी रीडिंग प्रोग्रेस ट्रैक करें।",
  },
];

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "16px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "88vh",
  overflowY: "auto",
  background: "var(--theme-card-bg, #0f172a)",
  border: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
  borderRadius: "20px",
  padding: "28px",
  boxSizing: "border-box",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

export default function OnboardingModal() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await settingsService.getSettings();
        const extra = settings.profile_extra;
        if (!extra.termsAcceptedAt) {
          setPhase("terms");
        } else if (!extra.onboardingCompletedAt) {
          setPhase("tour");
        } else {
          setPhase("hidden");
        }
      } catch {
        // If settings can't load (e.g. offline), don't block the dashboard
        // behind a modal that can't be dismissed.
        setPhase("hidden");
      }
    })();
  }, []);

  async function saveProfileExtraPatch(patch: Partial<{ termsAcceptedAt: string; onboardingCompletedAt: string }>) {
    const settings = await settingsService.getSettings();
    await settingsService.updateSection("profile_extra", {
      ...settings.profile_extra,
      ...patch,
    });
  }

  async function handleAcceptTerms() {
    if (!agreed) return;
    setSaving(true);
    try {
      await saveProfileExtraPatch({ termsAcceptedAt: new Date().toISOString() });
      setPhase("tour");
    } catch {
      // If saving fails, still let them proceed to the tour — worst case
      // they see the terms step again next load, which is harmless.
      setPhase("tour");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinishTour() {
    setSaving(true);
    try {
      await saveProfileExtraPatch({ onboardingCompletedAt: new Date().toISOString() });
    } finally {
      setSaving(false);
      setPhase("hidden");
    }
  }

  if (phase === "loading" || phase === "hidden") return null;

  const btnPrimary: React.CSSProperties = {
    background: "var(--theme-accent, #F59E0B)",
    color: "var(--theme-accent-text, #080C14)",
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
    fontWeight: 800,
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    color: "var(--theme-text-sub, #94A3B8)",
    border: "1px solid var(--theme-border, rgba(255,255,255,0.12))",
    borderRadius: "12px",
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        {phase === "terms" && (
          <>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)", marginBottom: "4px" }}>
              Terms &amp; Conditions
            </h2>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)", marginBottom: "16px" }}>
              नियम और शर्तें
            </p>

            <div
              style={{
                background: "var(--theme-bg-main, #080C14)",
                border: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "0.85rem",
                color: "var(--theme-text-sub, #CBD5E1)",
                lineHeight: 1.7,
                marginBottom: "16px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              <p style={{ marginBottom: "10px" }}>
                By using Mentora, you agree to use it for personal, non-commercial study purposes, keep your
                account credentials secure, and follow fair use of AI features (see usage limits in Settings).
              </p>
              <p style={{ marginBottom: "10px" }}>
                Mentora का उपयोग करके, आप सहमत होते हैं कि आप इसे केवल व्यक्तिगत पढ़ाई के लिए उपयोग करेंगे, अपने
                अकाउंट की जानकारी सुरक्षित रखेंगे, और AI फीचर्स का उचित उपयोग करेंगे।
              </p>
              <p>
                Read the full{" "}
                <Link href="/terms" target="_blank" style={{ color: "var(--theme-accent, #F59E0B)" }}>
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" style={{ color: "var(--theme-accent, #F59E0B)" }}>
                  Privacy Policy
                </Link>{" "}
                for complete details. / पूरी जानकारी के लिए पूरा पेज पढ़ें।
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "20px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px", flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.85rem", color: "var(--theme-text-main, #F8FAFC)", fontWeight: 600 }}>
                I have read and agree to the Terms &amp; Conditions.
                <br />
                मैंने नियम और शर्तें पढ़ ली हैं और सहमत हूँ।
              </span>
            </label>

            <button
              onClick={handleAcceptTerms}
              disabled={!agreed || saving}
              style={{ ...btnPrimary, width: "100%", opacity: !agreed || saving ? 0.5 : 1, cursor: !agreed || saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Continue / आगे बढ़ें →"}
            </button>
          </>
        )}

        {phase === "tour" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)", marginBottom: "2px" }}>
                  Welcome to Mentora! 🎉
                </h2>
                <p style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)" }}>
                  Mentora में आपका स्वागत है! 🎉
                </p>
              </div>
              <button
                onClick={handleFinishTour}
                aria-label="Skip"
                style={{ background: "none", border: "none", color: "var(--theme-text-sub, #94A3B8)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step dots */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: "4px",
                    borderRadius: "2px",
                    background: i <= step ? "var(--theme-accent, #F59E0B)" : "var(--theme-border, rgba(255,255,255,0.12))",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                background: "var(--theme-bg-main, #080C14)",
                border: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
                borderRadius: "16px",
                padding: "28px 20px",
                textAlign: "center",
                marginBottom: "20px",
                minHeight: "180px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "2.6rem", marginBottom: "12px" }}>{FEATURES[step].icon}</div>
              <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)", marginBottom: "2px" }}>
                {FEATURES[step].titleEn}
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)", marginBottom: "12px" }}>
                {FEATURES[step].titleHi}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub, #CBD5E1)", lineHeight: 1.6, marginBottom: "4px" }}>
                {FEATURES[step].descEn}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub, #CBD5E1)", lineHeight: 1.6 }}>
                {FEATURES[step].descHi}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} style={btnGhost}>
                  ← Back
                </button>
              )}
              <button onClick={handleFinishTour} style={{ ...btnGhost, marginLeft: step === 0 ? 0 : "auto" }}>
                Skip
              </button>
              {step < FEATURES.length - 1 ? (
                <button onClick={() => setStep((s) => s + 1)} style={{ ...btnPrimary, flex: 1 }}>
                  Next →
                </button>
              ) : (
                <button onClick={handleFinishTour} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? "..." : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                      <CheckCircle2 size={16} /> Get Started
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}