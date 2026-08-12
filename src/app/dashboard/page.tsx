"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Sparkles, ArrowRight, Volume2 } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { authService } from "@/services/authService";
import { testService, type TestResult } from "@/services/testService";
import { settingsService } from "@/services/settingsService";
import { createClient } from "@/lib/supabase";
import { isPremiumUser } from "@/lib/subscription";
import type { DateFormat } from "@/lib/dateFormat";
import { G } from "@/constants/colors";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Welcome from "@/components/dashboard/Welcome";
import StatsCards from "@/components/dashboard/StatsCards";
import TodayPlan from "@/components/dashboard/TodayPlan";
import RankCard from "@/components/dashboard/RankCard";
import StudyStreak from "@/components/dashboard/StudyStreak";
import ContinueReading from "@/components/dashboard/ContinueReading";
import RecentTests from "@/components/dashboard/RecentTests";
import FocusAreas from "@/components/dashboard/FocusAreas";
import OnboardingModal from "@/components/common/OnboardingModal";

export default function DashboardPage() {
  const { dashboard, loading, error, refresh } = useDashboard();
  // NOTE: this is the MOBILE default (sidebar starts closed, hamburger opens
  // it). On desktop, the sidebar is always shown regardless of this state —
  // see the ".dashboard-sidebar" rule in the <style> block below.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  // Settings → Language & Region → Date Format, passed down to any widget
  // (like Recent Tests) that shows a date.
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((settings) => {
        if (!cancelled) setDateFormat(settings.language_region.dateFormat as DateFormat);
      })
      .catch(() => {
        // Not fatal — dashboard still works with the default format.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Drives the sidebar's plan label and whether the "Upgrade Now" upsell
  // box shows at all - a paying customer should never see an ad to buy
  // what they already have.
  //
  // Uses authService.getCurrentUser() (deduped — see asyncCache.ts)
  // instead of a second, separate supabase.auth.getUser() call, since
  // useDashboard() above already asks the exact same question at the
  // exact same moment on every dashboard load. Firing both was two
  // redundant auth round trips instead of one shared one.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await authService.getCurrentUser();
      if (!user || cancelled) return;
      const supabase = createClient();
      const premium = await isPremiumUser(supabase, user.id);
      if (!cancelled) setIsPremium(premium);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================
  // Derived display values
  // These reshape the raw `dashboard` data (from Supabase) into the
  // exact shape each UI component needs.
  // ==========================

  const USER = {
    name: dashboard?.profile?.fullName ?? "Student",
    firstName:
      dashboard?.profile?.firstName ?? dashboard?.profile?.fullName?.split(" ")[0] ?? "Student",
    initials:
      dashboard?.profile?.fullName
        ?.split(" ")
        .map((name: string) => name[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() ?? "ST",
    plan: isPremium ? "Premium" : "Free Plan",
    exam: dashboard?.profile?.exam ?? "UPSC",
    streak: dashboard?.studyStreak?.current ?? dashboard?.profile?.streak ?? 0,
  };

  const STATS = {
    booksRead: dashboard?.continueReading?.length ?? 0,
    testsAttempted: dashboard?.stats?.mockTests ?? recentTests.length,
    accuracy:
      recentTests.length > 0
        ? Math.round(
            recentTests.reduce((sum, test) => sum + test.accuracy, 0) /
              recentTests.length
          )
        : 0,
    studyHours: dashboard?.stats?.totalStudyTime ?? 0,
  };

  const RANK = {
    national: dashboard?.rank?.nationalRank?.toLocaleString() ?? "--",
    percentile: dashboard?.rank ? `Top ${dashboard.rank.percentile}%` : "--",
    stateRank: dashboard?.rank?.stateRank?.toLocaleString() ?? "--",
    cityRank: dashboard?.rank?.cityRank?.toLocaleString() ?? "--",
  };

  const TASKS = dashboard?.todayTasks ?? [];
  const BOOKS = dashboard?.continueReading ?? [];

  // Map raw focus-area records into the { topic, pct, level } shape FocusAreas expects.
  const WEAK =
    dashboard?.focusAreas?.map((item) => ({
      topic: item.subject,
      pct: item.score,
      level: item.level === "medium" ? "mid" : item.level,
    })) ?? [];

  // ==========================
  // Load the 3 most recent test results separately
  // (not part of the main dashboard payload).
  // ==========================
  useEffect(() => {
    let cancelled = false;

    async function loadRecentTests() {
      try {
        const tests = await testService.getRecentResults(dashboard?.profile?.exam ?? "UPSC", 3);
        if (!cancelled) setRecentTests(tests);
      } catch (err) {
        console.error(err);
      }
    }

    if (dashboard) {
      loadRecentTests();
    }

    return () => {
      cancelled = true;
    };
  }, [dashboard]);

  // ==========================
  // Loading state
  // ==========================
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main, #080C14)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--theme-text-main, #F8FAFC)",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "3px solid var(--theme-accent-soft, rgba(245, 158, 11, 0.2))",
            borderTopColor: "var(--theme-accent, #F59E0B)",
            animation: "dashboard-spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: "0.9rem", color: "var(--theme-text-sub, #94A3B8)" }}>Loading Dashboard...</p>
        <style>{`@keyframes dashboard-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ==========================
  // Error state
  // ==========================
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main, #080C14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
        }}
      >
        <div style={{ ...G.card, padding: "32px", maxWidth: "520px", width: "100%", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px", color: "var(--theme-text-main, #F8FAFC)" }}>
            Failed to load Dashboard
          </h2>
          <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: "0.9rem", marginBottom: "20px" }}>{error}</p>
          <button
            onClick={refresh}
            style={{
              background: G.grad,
              border: "none",
              color: "var(--theme-accent-text, #000000)",
              padding: "10px 22px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // Main dashboard layout
  // ==========================
  return (
    <>
      <OnboardingModal />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--theme-bg-main, #080C14)",
          color: "var(--theme-text-main, #F8FAFC)",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userPlan={USER.plan} exam={USER.exam} isPremium={isPremium} />

      <main className="dashboard-main" style={{ flex: 1, marginLeft: "280px", padding: "28px", width: "100%", minWidth: 0 }}>
        <Header
          firstName={USER.firstName}
          exam={USER.exam}
          initials={USER.initials}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={refresh}
          isPremium={isPremium}
        />

        <Welcome name={USER.name} streak={USER.streak} nationalRank={RANK.national} />

        <StatsCards
          booksRead={STATS.booksRead}
          testsAttempted={STATS.testsAttempted}
          accuracy={STATS.accuracy}
          studyHours={STATS.studyHours}
        />

        {/* ==========================
            Video to Notes Quick Feature Card
           ========================== */}
        <div
          style={{
            ...G.card,
            padding: "24px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            background: "linear-gradient(135deg, var(--theme-accent-soft, rgba(245, 158, 11, 0.12)) 0%, var(--theme-card-bg, rgba(15, 23, 42, 0.7)) 100%)",
            border: "1px solid var(--theme-accent-border, rgba(245, 158, 11, 0.35))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "var(--theme-accent-soft, rgba(245, 158, 11, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Video size={24} style={{ color: "var(--theme-accent, #F59E0B)" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>Video to Notes AI</h3>
                <span
                  style={{
                    fontSize: "0.68rem",
                    background: "var(--theme-accent, #F59E0B)",
                    color: "var(--theme-accent-text, #000000)",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                  }}
                >
                  NEW MVP
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub, #94A3B8)" }}>
                Instantly turn lecture videos or YouTube URLs into structured multilingual study notes.
              </p>
            </div>
          </div>
          <Link
            href="/video-to-notes"
            style={{
              background: G.grad,
              color: "var(--theme-accent-text, #000000)",
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.85rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))",
              transition: "transform 0.2s ease",
            }}
          >
            Try Video to Notes <ArrowRight size={16} />
          </Link>
        </div>

        {/* ==========================
            Text to Audio Quick Feature Card
           ========================== */}
        <div
          style={{
            ...G.card,
            padding: "24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--theme-card-bg, rgba(15, 23, 42, 0.7)) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(59, 130, 246, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Volume2 size={24} style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>Text to Audio AI</h3>
                <span
                  style={{
                    fontSize: "0.68rem",
                    background: "#3B82F6",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                  }}
                >
                  NEW MVP
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub, #94A3B8)" }}>
                Convert study notes and text files into high-quality speech, right in your browser.
              </p>
            </div>
          </div>
          <Link
            href="/audio"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.85rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
              transition: "transform 0.2s ease",
            }}
          >
            Try Text to Audio <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-grid-1" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "start" }}>
          <TodayPlan tasks={TASKS} examFallback={USER.exam} />

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
            <RankCard
              national={RANK.national}
              percentile={RANK.percentile}
              stateRank={RANK.stateRank}
              cityRank={RANK.cityRank}
            />
            <StudyStreak streak={USER.streak} />
          </div>
        </div>

        <div
          className="dashboard-grid-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: "20px",
            marginTop: "20px",
            alignItems: "start",
          }}
        >
          <ContinueReading books={BOOKS} />
          <RecentTests tests={recentTests} dateFormat={dateFormat} />
        </div>

        <FocusAreas weakTopics={WEAK} exam={USER.exam} />

        {/* Quick stats footer */}
        <footer
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "18px",
          }}
        >
          <div style={{ ...G.card, padding: "20px" }}>
            <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".8rem", marginBottom: "8px" }}>Tasks Completed</p>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>
              {TASKS.filter((t) => t.done).length}
            </h2>
          </div>

          <div style={{ ...G.card, padding: "20px" }}>
            <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".8rem", marginBottom: "8px" }}>Books Reading</p>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>{BOOKS.length}</h2>
          </div>

          <div style={{ ...G.card, padding: "20px" }}>
            <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".8rem", marginBottom: "8px" }}>Weak Subjects</p>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>{WEAK.length}</h2>
          </div>

          <div style={{ ...G.card, padding: "20px" }}>
            <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".8rem", marginBottom: "8px" }}>Study Streak</p>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)" }}>🔥 {USER.streak}</h2>
          </div>
        </footer>
      </main>

      {/* ══════════════════════════════════════════
          Dashboard-wide responsive rules.
          ══════════════════════════════════════════ */}
      <style>{`
        @media (min-width: 969px) {
          .dashboard-sidebar { left: 0 !important; }
          .dashboard-overlay { display: none !important; }
          .sidebar-toggle-btn { display: none !important; }
        }

        @media (max-width: 968px) {
          .dashboard-main { margin-left: 0 !important; padding: 18px !important; }
          .dashboard-grid-1 { grid-template-columns: 1fr !important; }
          .dashboard-grid-2 { grid-template-columns: 1fr !important; }
          .dashboard-greeting-title { font-size: 1.5rem !important; }
        }

        @media (max-width: 420px) {
          .streak-day-dot { width: 28px !important; height: 28px !important; }
        }
      `}</style>
      </div>
    </>
  );
}