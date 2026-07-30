"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { CATEGORIES } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { authService } from "@/services/authService";
import { Mentor, MentorCategory } from "@/types/mentor";

import MentorFilters from "@/components/mentors/MentorFilters";
import MentorSection from "@/components/mentors/MentorSection";
import MentorCard from "@/components/mentors/MentorCard";
import { SlidersHorizontal, X } from "lucide-react";

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
    (async () => {
      try {
        const [allMentors, profile] = await Promise.all([
          mentorService.getAllMentors(),
          authService.getProfile(),
        ]);
        setMentors(allMentors);
        if (profile?.exam) setUserExam(profile.exam);
      } catch (err: any) {
        setLoadError(err.message ?? "Could not load mentors.");
      } finally {
        setLoading(false);
      }
    })();
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
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.08)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".88rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  });

  const categoryBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.08)",
    background: active ? G.grad : "rgba(22, 31, 49, 0.6)",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".8rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#06090e", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Sticky Top Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11, 15, 23, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #2d3748",
          padding: "14px 20px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <Link href="/dashboard" style={{ color: "#94A3B8", fontSize: ".85rem", textDecoration: "none", fontWeight: 600 }}>
            ← Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link
              href="/mentors/bookings"
              style={{ color: "#f59e0b", fontSize: ".85rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              📅 My Bookings
            </Link>
            <Link
              href="/mentors/apply"
              style={{
                background: G.grad,
                color: "#111827",
                fontSize: ".82rem",
                fontWeight: 800,
                padding: "7px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
            >
              ✨ Become a Mentor
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 60px" }}>
        
        {/* Title Header & Become a Mentor Banner Callout */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "4px", color: "white" }}>Find a Mentor</h1>
            <p style={{ color: "#a0aec0", fontSize: ".88rem" }}>
              Book 1-on-1 sessions with academic, skill, and career experts.
            </p>
          </div>
        </div>

        {/* Online / Offline toggle + Mobile Filter Trigger */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "340px" }}>
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
              background: "#161f31",
              border: "1px solid #2d3748",
              color: "white",
              padding: "10px 14px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.85rem",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
            className="mobile-filter-trigger"
          >
            <SlidersHorizontal size={16} style={{ color: "#f59e0b" }} /> Filters
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
            scrollbarWidth: "none" 
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
        <div style={{ background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "18px", padding: "18px 20px", marginBottom: "28px" }}>
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

        {loadError && <p style={{ color: "#f87171", fontSize: ".85rem", marginBottom: "16px" }}>{loadError}</p>}

        {!loading && !loadError && (
          <>
            {recommended.length > 0 && (
              <MentorSection title={`Recommended for ${userExam}`} mentors={recommended} />
            )}
            <MentorSection title="Top Rated Mentors" mentors={topRated} />
          </>
        )}

        {/* Full directory section (Single column clean layout) */}
        <section style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white" }}>
              All {mode === "online" ? "Online" : "Offline"} Mentors ({filtered.length})
            </h2>
          </div>

          <div>
            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#a0aec0", fontSize: "0.9rem" }}>Loading mentors...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#a0aec0", background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "20px" }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px", color: "white" }}>No mentors found</p>
                <p style={{ fontSize: "0.85rem" }}>Try adjusting your filters, category, or search term.</p>
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
            background: "linear-gradient(135deg, rgba(22, 31, 49, 0.8) 0%, rgba(11, 15, 23, 0.95) 100%)",
            border: "1px solid #2d3748",
            borderRadius: "20px",
            padding: "32px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", marginBottom: "8px" }}>
              Want to share your expertise and mentor aspirants?
            </h3>
            <p style={{ color: "#94A3B8", fontSize: ".9rem", lineHeight: "1.5" }}>
              Join our elite roster of mentors, guide students through their preparation journey, and monetize your knowledge on Mentora.
            </p>
          </div>
          <Link
            href="/mentors/apply"
            style={{
              background: G.grad,
              color: "#111827",
              fontWeight: 800,
              fontSize: ".9rem",
              padding: "12px 24px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
              transition: "transform 0.2s ease",
              whiteSpace: "nowrap"
            }}
          >
            Apply as a Mentor →
          </Link>
        </section>

      </div>

      {/* Mobile Filters Drawer / Modal */}
      {mobileFiltersOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "100%", maxWidth: "340px", background: "#0b0f17", height: "100%", padding: "24px", overflowY: "auto", borderLeft: "1px solid #2d3748", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "white" }}>Filter Mentors</h3>
                <button onClick={() => setMobileFiltersOpen(false)} style={{ background: "transparent", border: "none", color: "#a0aec0", cursor: "pointer" }}>
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
              style={{ width: "100%", background: "#f59e0b", border: "none", color: "#000", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", marginTop: "20px" }}
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