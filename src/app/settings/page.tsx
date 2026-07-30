"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { settingsService, UserSettings, DEFAULT_SETTINGS } from "@/services/settingsService";
import { G } from "@/components/settings/shared";
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [user, profile, userSettings] = await Promise.all([
          authService.getCurrentUser(),
          authService.getProfile(),
          settingsService.getSettings(),
        ]);

        setBasic({
          email: user?.email ?? "",
          fullName: profile?.full_name ?? "",
          firstName: profile?.first_name ?? "",
          exam: profile?.exam ?? "UPSC",
        });
        setSettings(userSettings);
      } catch (err: any) {
        setLoadError(err.message ?? "Could not load your settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSaveProfile(
    basicData: { full_name: string; first_name: string; exam: string },
    extra: UserSettings["profile_extra"]
  ) {
    await Promise.all([
      authService.updateProfile(basicData),
      settingsService.updateSection("profile_extra", extra),
    ]);
    setBasic({
      email: basic.email,
      fullName: basicData.full_name,
      firstName: basicData.first_name,
      exam: basicData.exam,
    });
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
        background: "#080C14",
        color: "white",
        fontFamily: "'DM Sans',sans-serif",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "6px" }}>
            <span style={G.gradText}>Settings</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".9rem" }}>
            Manage your profile, AI Mentor behavior, study preferences, and more.
          </p>
        </header>

        {loadError && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{loadError}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "28px", alignItems: "start" }}>
          <SettingsNav active={tab} onChange={setTab} />

          <div style={{ ...G.card, padding: "28px" }}>
            {loading ? (
              <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
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
                  <StudyPreferencesSection value={settings.study_preferences} onSave={makeSectionSaver("study_preferences")} />
                )}
                {tab === "ai" && <AIMentorSection value={settings.ai_mentor} onSave={makeSectionSaver("ai_mentor")} />}
                {tab === "learning" && (
                  <LearningSection value={settings.learning_preferences} onSave={makeSectionSaver("learning_preferences")} />
                )}
                {tab === "analytics" && <AnalyticsSection />}
                {tab === "notifications" && (
                  <NotificationsSection value={settings.notifications} onSave={makeSectionSaver("notifications")} />
                )}
                {tab === "appearance" && (
                  <AppearanceSection value={settings.appearance} onSave={makeSectionSaver("appearance")} />
                )}
                {tab === "language" && (
                  <LanguageRegionSection value={settings.language_region} onSave={makeSectionSaver("language_region")} />
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