"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { EXAMS, TYPES } from "@/constants/library";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import { authService } from "@/services/authService";
import { LibraryProgress, Book } from "@/types/book";

import LibrarySearchBar from "@/components/library/LibrarySearchBar";
import CategoryGrid from "@/components/library/CategoryGrid";
import BookSection from "@/components/library/BookSection";
import BookCard from "@/components/library/BookCard";

// Converts a downloads string like "120K" into a plain number for sorting.
// (Kept here since it's only needed for the "Trending" sort, nowhere else.)
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
    (async () => {
      try {
        const [progressRows, profile, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          authService.getProfile(),
          bookService.getAllBooks(),
        ]);
        setProgress(progressRows);
        setBooks(allBooks);
        if (profile?.exam) setUserExam(profile.exam);
      } catch (err: any) {
        // Not fatal for progress/profile — but if the books table itself
        // failed to load, surface it since the whole page depends on it.
        console.error("Library data load error:", err?.message ?? err?.code ?? err);
        setLoadError(err?.message ?? "Could not load the book catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const favorites = useMemo(() => progress.filter((p) => p.is_favorite).map((p) => Number(p.book_id)), [progress]);
  const wishlist = useMemo(() => progress.filter((p) => p.is_wishlisted).map((p) => Number(p.book_id)), [progress]);

  async function handleToggleFavorite(bookId: number) {
    const isCurrentlyFavorite = favorites.includes(bookId);

    // Optimistic update so the UI feels instant, then sync to Supabase.
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
      console.error("Could not save favorite:", (err as any)?.message ?? err);
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
      console.error("Could not save wishlist:", (err as any)?.message ?? err);
    }
  }

  // ── Continue Reading: books with saved progress, most recently opened first ──
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

  // ── Recommended: same exam as the student's profile, highest rated first ──
  const recommendedBooks = useMemo(
    () => books.filter((b) => b.exam === userExam).sort((a, b) => b.rating - a.rating).slice(0, 8),
    [userExam, books]
  );

  // ── Trending: highest download count ──
  const trendingBooks = useMemo(
    () => [...books].sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads)).slice(0, 8),
    [books]
  );

  // ── New Arrivals ──
  const newArrivals = useMemo(() => books.filter((b) => b.isNew), [books]);

  // ── Main filtered grid (search + exam + type) ──
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

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8,12,20,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 32px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: G.grad,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "white" }}>
              Mentor<span style={{ color: "#F59E0B" }}>a</span>
            </span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "#64748B", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
          <Link
            href="/library/personal"
            style={{
              marginLeft: "auto",
              fontSize: "0.85rem",
              color: "#F59E0B",
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
              color: "#F59E0B",
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
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "6px" }}>Digital Library</h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>
            {books.length}+ books, notes, PYQs and magazines — all in one place.
          </p>
        </div>

        <LibrarySearchBar value={search} onChange={setSearch} />

        {loadError && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{loadError}</p>
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
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>All Resources</h2>
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
                    border: examFilter === ex ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                    background: examFilter === ex ? G.grad : "#111827",
                    color: examFilter === ex ? "#111827" : "#94A3B8",
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
                    fontWeight: 500,
                    cursor: "pointer",
                    border: typeFilter === t ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    background: typeFilter === t ? "rgba(245,158,11,0.1)" : "transparent",
                    color: typeFilter === t ? "#F59E0B" : "#64748B",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: "18px" }}>
            Showing <strong style={{ color: "#CBD5E1" }}>{filtered.length}</strong> result
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
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>No results found</h3>
              <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}