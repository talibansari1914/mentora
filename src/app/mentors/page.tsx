"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { authService } from "@/services/authService";
import { Mentor, MentorCategory } from "@/types/mentor";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

import MentorFilters from "@/components/mentors/MentorFilters";
import MentorSection from "@/components/mentors/MentorSection";
import MentorCard from "@/components/mentors/MentorCard";
import { SlidersHorizontal, X, Zap } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

type ModeFilter = "online" | "offline";
type CategoryFilter = MentorCategory | "all";

export default function MentorsHomePage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userExam, setUserExam] = useState("UPSC");

  const [mode, setMode] = useState<ModeFilter>("online");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("Any");
  const [minExperience, setMinExperience] = useState(0);
  const [sort, setSort] = useState("recommended");

  // Mobile filters drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [allMentors, profile] = await Promise.all([
          mentorService.getAllMentors(),
          authService.getProfile(),
        ]);
        if (cancelled) return;
        setMentors(allMentors);
        if (profile?.exam) setUserExam(profile.exam);
      } catch (err: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Could not load mentors."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Avoids setting state on this component after it's unmounted (e.g.
    // the user navigates away while this fetch is still in flight).
    return () => {
      cancelled = true;
    };
  }, []);

  const modeMentors = useMemo(
    () => mentors.filter((m) => m.mentorType === mode || m.mentorType === "hybrid"),
    [mentors, mode]
  );

  const recommended = useMemo(() => {
    const examLower = userExam.toLowerCase();
    return modeMentors
      .filter((m) => m.expertise.some((e) => e.toLowerCase().includes(examLower)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);
  }, [modeMentors, userExam]);

  const topRated = useMemo(
    () => [...modeMentors].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [modeMentors]
  );

  const filtered = useMemo(() => {
    let list = modeMentors.filter((m) => {
      const matchCategory = category === "all" || m.category === category;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()));
      const matchLanguage = language === "Any" || m.languages.includes(language);
      const matchExperience = m.experienceYears >= minExperience;
      return matchCategory && matchSearch && matchLanguage && matchExperience;
    });

    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === "price_low") list = [...list].sort((a, b) => a.sessionCharge - b.sessionCharge);
    else if (sort === "price_high") list = [...list].sort((a, b) => b.sessionCharge - a.sessionCharge);
    else if (sort === "experience") list = [...list].sort((a, b) => b.experienceYears - a.experienceYears);

    return list;
  }, [modeMentors, category, search, language, minExperience, sort]);

  const modeBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 16px",
    borderRadius: "12px",
    border: active ? "1px solid var(--theme-accent)" : "1px solid var(--theme-border)",
    background: active ? "var(--theme-accent)" : "var(--theme-card-bg)",
    color: active ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
    fontWeight: 700,
    fontSize: ".88rem",
    cursor: "pointer",
    boxShadow: active ? "0 4px 14px var(--theme-accent-glow)" : "none",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  });

  const categoryBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: "10px",
    border: active ? "1px solid var(--theme-accent)" : "1px solid var(--theme-border)",
    background: active ? "var(--theme-accent)" : "var(--theme-card-bg)",
    color: active ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
    fontWeight: 700,
    fontSize: ".8rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
    boxShadow: active ? "0 4px 12px var(--theme-accent-glow)" : "none",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--theme-bg-main)", color: "var(--theme-text-main)", fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky Top Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--theme-card-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--theme-border)",
          padding: "14px clamp(16px, 4vw, 24px)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <BackToDashboardLink inline />

          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <Link
              href="/mentors/bookings"
              style={{ color: "var(--theme-accent)", fontSize: ".85rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              📅 My Bookings
            </Link>
            <Link
              href="/mentors/apply"
              style={{
                background: "var(--theme-accent)",
                color: "var(--theme-accent-text)",
                fontSize: ".82rem",
                fontWeight: 800,
                padding: "7px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                boxShadow: "0 4px 12px var(--theme-accent-glow)",
                transition: "opacity 0.2s ease",
              }}
            >
              ✨ Become a Mentor
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px clamp(12px, 4vw, 20px) 60px", boxSizing: "border-box" }}>
        {/* Title Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.7rem)", fontWeight: 800, marginBottom: "4px", color: "var(--theme-text-main)", letterSpacing: "-0.02em" }}>
              Find a <span style={{ color: "var(--theme-accent)" }}>Mentor</span>
            </h1>
            <p style={{ color: "var(--theme-text-sub)", fontSize: ".88rem", fontWeight: 500 }}>
              Book 1-on-1 sessions with academic, skill, and career experts.
            </p>
          </div>
        </div>

        {/* Online / Offline toggle + Mobile Filter Trigger */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "340px", minWidth: "220px" }}>
            <button style={modeBtn(mode === "online")} onClick={() => setMode("online")}>
              🟢 Online Sessions
            </button>
            <button style={modeBtn(mode === "offline")} onClick={() => setMode("offline")}>
              🔵 Offline Meetups
            </button>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              display: "none",
              background: "var(--theme-card-bg)",
              border: "1px solid var(--theme-border)",
              color: "var(--theme-text-main)",
              padding: "10px 14px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.85rem",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
            className="mobile-filter-trigger"
          >
            <SlidersHorizontal size={16} style={{ color: "var(--theme-accent)" }} /> Filters
          </button>
        </div>

        {/* Category horizontal scroll container */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "20px",
            scrollbarWidth: "none",
          }}
        >
          <button style={categoryBtn(category === "all")} onClick={() => setCategory("all")}>
            All Mentors
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.value} style={categoryBtn(category === c.value)} onClick={() => setCategory(c.value)}>
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* TOP FILTERS BAR */}
        <div
          style={{
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "18px",
            padding: "18px 20px",
            marginBottom: "28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            boxSizing: "border-box",
          }}
        >
          <MentorFilters
            search={search}
            onSearchChange={setSearch}
            language={language}
            onLanguageChange={setLanguage}
            minExperience={minExperience}
            onMinExperienceChange={setMinExperience}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {loadError && <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px", fontWeight: 600 }}>⚠️ {loadError}</p>}

        {!loading && !loadError && (
          <>
            {recommended.length > 0 && (
              <MentorSection title={`Recommended for ${userExam}`} mentors={recommended} />
            )}
            <MentorSection title="Top Rated Mentors" mentors={topRated} />
          </>
        )}

        {/* Full directory section */}
        <section style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--theme-text-main)" }}>
              All {mode === "online" ? "Online" : "Offline"} Mentors ({filtered.length})
            </h2>
          </div>

          <div>
            {loading ? (
              <div
                style={{
                  background: "var(--theme-card-bg)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "20px",
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--theme-text-sub)",
                  fontWeight: 600,
                }}
              >
                Loading mentors...
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--theme-text-sub)",
                  background: "var(--theme-card-bg)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                }}
              >
                <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px", color: "var(--theme-text-main)" }}>No mentors found</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>Try adjusting your filters, category, or search term.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px" }}>
                {filtered.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Become a Mentor Callout Section */}
        <section
          style={{
            marginTop: "60px",
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "20px",
            padding: "32px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "8px" }}>
              Want to share your expertise and mentor aspirants?
            </h3>
            <p style={{ color: "var(--theme-text-sub)", fontSize: ".9rem", lineHeight: "1.5", fontWeight: 500 }}>
              Join our elite roster of mentors, guide students through their preparation journey, and monetize your knowledge on Mentora.
            </p>
          </div>
          <Link
            href="/mentors/apply"
            style={{
              background: "var(--theme-accent)",
              color: "var(--theme-accent-text)",
              fontWeight: 800,
              fontSize: ".9rem",
              padding: "12px 24px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 14px var(--theme-accent-glow)",
              transition: "transform 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            Apply as a Mentor →
          </Link>
        </section>
      </div>

      {/* Mobile Filters Drawer / Modal */}
      {mobileFiltersOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              background: "var(--theme-card-bg)",
              height: "100%",
              padding: "24px",
              overflowY: "auto",
              borderLeft: "1px solid var(--theme-border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--theme-text-main)" }}>Filter Mentors</h3>
                <button onClick={() => setMobileFiltersOpen(false)} style={{ background: "transparent", border: "none", color: "var(--theme-text-sub)", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              </div>

              <MentorFilters
                search={search}
                onSearchChange={setSearch}
                language={language}
                onLanguageChange={setLanguage}
                minExperience={minExperience}
                onMinExperienceChange={setMinExperience}
                sort={sort}
                onSortChange={setSort}
              />
            </div>

            <button
              onClick={() => setMobileFiltersOpen(false)}
              style={{
                width: "100%",
                background: "var(--theme-accent)",
                border: "none",
                color: "var(--theme-accent-text)",
                padding: "12px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
                marginTop: "20px",
                boxShadow: "0 4px 12px var(--theme-accent-glow)",
              }}
            >
              Apply Filters ({filtered.length} Results)
            </button>
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .mobile-filter-trigger {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          .mobile-filter-trigger {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}