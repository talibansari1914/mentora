"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EXAMS, TYPES } from "@/constants/library";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { authService } from "@/services/authService";
import { LibraryProgress, Book } from "@/types/book";

import LibrarySearchBar from "@/components/library/LibrarySearchBar";
import CategoryGrid from "@/components/library/CategoryGrid";
import BookSection from "@/components/library/BookSection";
import BookCard from "@/components/library/BookCard";
import { getErrorMessage } from "@/lib/errors";

// Converts a downloads string like "120K" into a plain number for sorting.
function parseDownloads(value: string): number {
  const num = parseFloat(value);
  if (value.toUpperCase().includes("M")) return num * 1_000_000;
  if (value.toUpperCase().includes("K")) return num * 1_000;
  return num;
}

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");

  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [userExam, setUserExam] = useState("UPSC");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [progressRows, profile, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          authService.getProfile(),
          bookService.getAllBooks(),
        ]);
        if (cancelled) return;
        setProgress(progressRows);
        setBooks(allBooks);
        if (profile?.exam) setUserExam(profile.exam);
      } catch (err: unknown) {
        console.error("Library data load error:", getErrorMessage(err, "unknown error"));
        if (!cancelled) setLoadError(getErrorMessage(err, "Could not load the book catalog."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const favorites = useMemo(() => progress.filter((p) => p.is_favorite).map((p) => Number(p.book_id)), [progress]);
  const wishlist = useMemo(() => progress.filter((p) => p.is_wishlisted).map((p) => Number(p.book_id)), [progress]);

  async function handleToggleFavorite(bookId: number) {
    const isCurrentlyFavorite = favorites.includes(bookId);

    setProgress((prev) => {
      const existing = prev.find((p) => Number(p.book_id) === bookId);
      if (existing) {
        return prev.map((p) =>
          Number(p.book_id) === bookId ? { ...p, is_favorite: !isCurrentlyFavorite } : p
        );
      }
      return [
        ...prev,
        {
          book_id: String(bookId),
          progress_percent: 0,
          is_favorite: true,
          is_wishlisted: false,
          last_opened_at: new Date().toISOString(),
        },
      ];
    });

    try {
      await libraryService.toggleFavorite(String(bookId), !isCurrentlyFavorite);
    } catch (err) {
      console.error("Could not save favorite:", getErrorMessage(err));
    }
  }

  async function handleToggleWishlist(bookId: number) {
    const isCurrentlyWishlisted = wishlist.includes(bookId);

    setProgress((prev) => {
      const existing = prev.find((p) => Number(p.book_id) === bookId);
      if (existing) {
        return prev.map((p) =>
          Number(p.book_id) === bookId ? { ...p, is_wishlisted: !isCurrentlyWishlisted } : p
        );
      }
      return [
        ...prev,
        {
          book_id: String(bookId),
          progress_percent: 0,
          is_favorite: false,
          is_wishlisted: true,
          last_opened_at: new Date().toISOString(),
        },
      ];
    });

    try {
      await libraryService.toggleWishlist(String(bookId), !isCurrentlyWishlisted);
    } catch (err) {
      console.error("Could not save wishlist:", getErrorMessage(err));
    }
  }

  const continueReadingBooks = useMemo(() => {
    const inProgress = progress.filter((p) => p.progress_percent > 0 && p.progress_percent < 100);
    return inProgress
      .map((p) => books.find((b) => b.id === Number(p.book_id)))
      .filter((b): b is NonNullable<typeof b> => !!b);
  }, [progress, books]);

  const progressMap = useMemo(() => {
    const map: Record<number, number> = {};
    progress.forEach((p) => {
      map[Number(p.book_id)] = p.progress_percent;
    });
    return map;
  }, [progress]);

  const recommendedBooks = useMemo(
    () => books.filter((b) => b.exam === userExam).sort((a, b) => b.rating - a.rating).slice(0, 8),
    [userExam, books]
  );

  const trendingBooks = useMemo(
    () => [...books].sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads)).slice(0, 8),
    [books]
  );

  const newArrivals = useMemo(() => books.filter((b) => b.isNew), [books]);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      const matchExam = examFilter === "All" || b.exam === examFilter;
      const matchType = typeFilter === "All Types" || b.type === typeFilter;
      return matchSearch && matchExam && matchType;
    });
  }, [search, examFilter, typeFilter, books]);

  const categoryExams = EXAMS.filter((e) => e !== "All");

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval, and — importantly —
  // no more "force override child component colors via inline-style string
  // matching" hack. That hack existed because child components (BookCard,
  // BookSection, CategoryGrid, LibrarySearchBar, etc.) used to hardcode
  // light-only colors; now that they read the same CSS variables directly,
  // there's nothing left for that override to patch, so it's removed.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    headerBg: "var(--theme-card-bg, rgba(8, 12, 20, 0.92))",
    headerBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    cardBg: "var(--theme-card-bg, #111827)",
    cardBorder: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
    subText: "var(--theme-text-sub, #94A3B8)",
    inactiveBtnBg: "var(--theme-card-bg, #111827)",
    inactiveBtnBorder: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
    inactiveBtnColor: "var(--theme-text-sub, #94A3B8)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: themeStyles.headerBg,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${themeStyles.headerBorder}`,
          padding: "16px 32px",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#0F172A",
                boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)",
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: themeStyles.color }}>
              Mentor<span style={{ color: "var(--theme-accent, #D97706)" }}>a</span>
            </span>
          </Link>
          <BackToDashboardLink inline />
          <Link
            href="/library/personal"
            style={{
              marginLeft: "auto",
              fontSize: "0.85rem",
              color: "var(--theme-accent, #D97706)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            📁 My Library →
          </Link>
          <Link
            href="/library/ai-tools"
            style={{
              fontSize: "0.85rem",
              color: "var(--theme-accent, #D97706)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            🤖 AI Book Tools →
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 32px 60px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "6px", color: themeStyles.color }}>Digital Library</h1>
          <p style={{ color: themeStyles.subText, fontSize: "0.9rem", fontWeight: 500 }}>
            {books.length}+ books, notes, PYQs and magazines — all in one place.
          </p>
        </div>

        <LibrarySearchBar value={search} onChange={setSearch} />

        {loadError && (
          <p style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 600 }}>{loadError}</p>
        )}

        {!loading && (
          <>
            <BookSection
              title="Continue Reading"
              books={continueReadingBooks}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              progressMap={progressMap}
              emptyMessage="Nothing in progress yet — open a book below to start."
            />

            <CategoryGrid exams={categoryExams} books={books} onSelectCategory={setExamFilter} />

            <BookSection
              title={`Recommended for ${userExam}`}
              books={recommendedBooks}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />

            <BookSection
              title="Trending Now"
              books={trendingBooks}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />

            <BookSection
              title="New Arrivals"
              books={newArrivals}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          </>
        )}

        {/* Full filterable grid */}
        <section style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: themeStyles.color }}>All Resources</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {EXAMS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExamFilter(ex)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "100px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: examFilter === ex ? "1px solid transparent" : themeStyles.inactiveBtnBorder,
                    background: examFilter === ex ? "var(--theme-accent, #F59E0B)" : themeStyles.inactiveBtnBg,
                    color: examFilter === ex ? "var(--theme-accent-text, #080C14)" : themeStyles.inactiveBtnColor,
                    boxShadow: examFilter === ex ? "0 2px 4px var(--theme-accent-glow, rgba(245, 158, 11, 0.2))" : "0 1px 2px rgba(0,0,0,0.02)",
                    transition: "all 0.2s",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: typeFilter === t ? "1px solid var(--theme-accent-border, rgba(245,158,11,0.5))" : themeStyles.inactiveBtnBorder,
                    background: typeFilter === t ? "var(--theme-accent-soft, rgba(245,158,11,0.1))" : themeStyles.inactiveBtnBg,
                    color: typeFilter === t ? "var(--theme-accent, #D97706)" : themeStyles.inactiveBtnColor,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    transition: "all 0.2s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.82rem", color: themeStyles.subText, marginBottom: "18px", fontWeight: 600 }}>
            Showing <strong style={{ color: themeStyles.color }}>{filtered.length}</strong> result
            {filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "18px" }}>
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isFavorite={favorites.includes(book.id)}
                  onToggleFavorite={handleToggleFavorite}
                  isWishlisted={wishlist.includes(book.id)}
                  onToggleWishlist={handleToggleWishlist}
                  progressPercent={progressMap[book.id]}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: themeStyles.cardBg,
                border: themeStyles.cardBorder,
                borderRadius: "16px",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px", color: themeStyles.color }}>No results found</h3>
              <p style={{ color: themeStyles.subText, fontSize: "0.875rem", fontWeight: 500 }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}