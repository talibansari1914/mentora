"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { authService } from "@/services/authService";
import { settingsService, UserSettings, DEFAULT_SETTINGS } from "@/services/settingsService";
import SettingsNav from "@/components/settings/SettingsNav";
import type { SettingsTab } from "@/components/settings/types";
import ProfileSection from "@/components/settings/ProfileSection";
import StudyPreferencesSection from "@/components/settings/StudyPreferencesSection";
import AIMentorSection from "@/components/settings/AIMentorSection";
import LearningSection from "@/components/settings/LearningSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import LanguageRegionSection from "@/components/settings/LanguageRegionSection";
import PrivacySection from "@/components/settings/PrivacySection";
import AnalyticsSection from "@/components/settings/AnalyticsSection";
import HelpSupportSection from "@/components/settings/HelpSupportSection";
import AboutSection from "@/components/settings/AboutSection";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

interface BasicProfile {
  email: string;
  fullName: string;
  firstName: string;
  exam: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [basic, setBasic] = useState<BasicProfile>({ email: "", fullName: "", firstName: "", exam: "UPSC" });
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Tracks whether this page is still mounted, so loadData() (also
  // reachable via the retry button below) doesn't call setState after the
  // user has already navigated away while a request was in flight.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // React StrictMode (dev only) double-invokes this effect: mount ->
    // cleanup -> mount again. Without resetting to `true` here, the first
    // (StrictMode-only) cleanup would permanently leave this `false` even
    // though the component is genuinely mounted — silently dropping every
    // setState call below for the rest of this component's real lifetime.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [user, profile, userSettings] = await Promise.all([
        authService.getCurrentUser(),
        authService.getProfile(),
        settingsService.getSettings(),
      ]);

      if (!isMountedRef.current) return;

      setBasic({
        email: user?.email ?? "",
        fullName: profile?.full_name ?? "",
        firstName: profile?.first_name ?? "",
        exam: profile?.exam ?? "UPSC",
      });
      setSettings(userSettings);
    } catch (err: unknown) {
      if (isMountedRef.current) setLoadError(getErrorMessage(err, "Could not load your settings. Please try again."));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveProfile(
    basicData: { full_name: string; first_name: string; exam: string },
    extra: UserSettings["profile_extra"]
  ) {
    await Promise.all([
      authService.updateProfile(basicData),
      settingsService.updateSection("profile_extra", extra),
    ]);
    setBasic((prev) => ({
      ...prev,
      fullName: basicData.full_name,
      firstName: basicData.first_name,
      exam: basicData.exam,
    }));
    setSettings((prev) => ({ ...prev, profile_extra: extra }));
  }

  function makeSectionSaver<K extends keyof Omit<UserSettings, "user_id">>(section: K) {
    return async (value: UserSettings[K]) => {
      await settingsService.updateSection(section, value);
      setSettings((prev) => ({ ...prev, [section]: value }));
    };
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--theme-bg-main, #F1F5F9)",
        color: "var(--theme-text-main, #0F172A)",
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      {/* Dropdown Options & Responsive Fix */}
      <style>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 28px;
          align-items: start;
        }

        select option {
          background-color: var(--theme-card-bg, #FFFFFF) !important;
          color: var(--theme-text-main, #0F172A) !important;
          padding: 8px 12px;
        }

        @media (max-width: 868px) {
          .settings-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 480px) {
          .settings-page-wrapper {
            padding: 16px 12px !important;
          }
        }
      `}</style>

      <div className="settings-page-wrapper" style={{ maxWidth: "1080px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <header style={{ marginBottom: "28px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-text-main, #0F172A)", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Settings
          </h1>
          <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.9rem" }}>
            Manage your account profile, AI Mentor behavior, study goals, and application preferences.
          </p>
        </header>

        {loadError && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              marginBottom: "20px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.88rem",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadData}
              style={{
                background: "#EF4444",
                border: "none",
                color: "#FFFFFF",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        <div className="settings-layout">
          {/* Settings Navigation Sidebar */}
          <SettingsNav active={tab} onChange={setTab} />

          {/* Settings Active Section Panel */}
          <div
            style={{
              background: "var(--theme-card-bg, #FFFFFF)",
              border: "1px solid var(--theme-border, #E2E8F0)",
              borderRadius: "16px",
              padding: "28px",
              minHeight: "500px",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
              boxSizing: "border-box",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "360px",
                  gap: "12px",
                  color: "var(--theme-text-sub, #64748B)",
                }}
              >
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--theme-accent, #F59E0B)" }} />
                <p style={{ fontSize: "0.88rem", fontWeight: 500 }}>Loading settings...</p>
              </div>
            ) : (
              <>
                {tab === "profile" && (
                  <ProfileSection
                    email={basic.email}
                    fullName={basic.fullName}
                    firstName={basic.firstName}
                    exam={basic.exam}
                    extra={settings.profile_extra}
                    onSave={handleSaveProfile}
                  />
                )}
                {tab === "privacy" && <PrivacySection email={basic.email} />}
                {tab === "study" && (
                  <StudyPreferencesSection
                    value={settings.study_preferences}
                    onSave={makeSectionSaver("study_preferences")}
                  />
                )}
                {tab === "ai" && <AIMentorSection value={settings.ai_mentor} onSave={makeSectionSaver("ai_mentor")} />}
                {tab === "learning" && (
                  <LearningSection
                    value={settings.learning_preferences}
                    onSave={makeSectionSaver("learning_preferences")}
                  />
                )}
                {tab === "analytics" && <AnalyticsSection />}
                {tab === "notifications" && (
                  <NotificationsSection
                    value={settings.notifications}
                    onSave={makeSectionSaver("notifications")}
                  />
                )}
                {tab === "appearance" && (
                  <AppearanceSection
                    value={settings.appearance}
                    onSave={makeSectionSaver("appearance")}
                  />
                )}
                {tab === "language" && (
                  <LanguageRegionSection
                    value={settings.language_region}
                    onSave={makeSectionSaver("language_region")}
                  />
                )}
                {tab === "help" && <HelpSupportSection />}
                {tab === "about" && <AboutSection />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}