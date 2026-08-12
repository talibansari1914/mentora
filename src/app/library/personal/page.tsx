"use client";

import { useEffect, useMemo, useState } from "react";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import { LibraryProgress, Collection, Book } from "@/types/book";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

import BookGrid from "@/components/library/BookGrid";
import CollectionsPanel from "@/components/library/CollectionsPanel";
import { getErrorMessage } from "@/lib/errors";

export type PersonalTab = "continue" | "favorites" | "wishlist" | "completed" | "history" | "collections";

const TABS: { id: PersonalTab; label: string; icon: string }[] = [
  { id: "continue", label: "Continue Reading", icon: "📖" },
  { id: "favorites", label: "Favorites", icon: "🏷️" },
  { id: "wishlist", label: "Wishlist", icon: "🤍" },
  { id: "completed", label: "Completed", icon: "✅" },
  { id: "history", label: "Reading History", icon: "⏱️" },
  { id: "collections", label: "Collections", icon: "📁" },
];

export default function PersonalLibraryPage() {
  const [tab, setTab] = useState<PersonalTab>("continue");
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [progressRows, collectionRows, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          libraryService.getCollections(),
          bookService.getAllBooks(),
        ]);
        if (cancelled) return;
        setProgress(progressRows);
        setBooks(allBooks);
        setCollections(collectionRows);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your library."));
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

  const progressMap = useMemo(() => {
    const map: Record<number, number> = {};
    progress.forEach((p) => {
      map[Number(p.book_id)] = p.progress_percent;
    });
    return map;
  }, [progress]);

  async function handleToggleFavorite(bookId: number) {
    const isCurrentlyFavorite = favorites.includes(bookId);

    setProgress((prev) => {
      const existing = prev.find((p) => Number(p.book_id) === bookId);
      if (existing) {
        return prev.map((p) => (Number(p.book_id) === bookId ? { ...p, is_favorite: !isCurrentlyFavorite } : p));
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
        return prev.map((p) => (Number(p.book_id) === bookId ? { ...p, is_wishlisted: !isCurrentlyWishlisted } : p));
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

  function booksFor(predicate: (p: LibraryProgress) => boolean, sortByRecent = false) {
    let rows = progress.filter(predicate);
    if (sortByRecent) {
      rows = [...rows].sort(
        (a, b) => new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime()
      );
    }
    return rows
      .map((p) => books.find((b) => b.id === Number(p.book_id)))
      .filter((b): b is NonNullable<typeof b> => !!b);
  }

  const wishlistBooks = booksFor((p) => p.is_wishlisted);
  const continueBooks = booksFor((p) => p.progress_percent > 0 && p.progress_percent < 100, true);
  const completedBooks = booksFor((p) => p.progress_percent >= 100);
  const historyBooks = booksFor((p) => !!p.last_opened_at, true);
  const favoriteBooks = books.filter((b) => favorites.includes(b.id));

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    accent: "var(--theme-accent, #D97706)",
    tabBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    tabActiveBg: "var(--theme-accent, #F59E0B)",
    tabActiveColor: "var(--theme-accent-text, #0F172A)",
    tabInactiveBg: "var(--theme-card-bg, #111827)",
    tabInactiveColor: "var(--theme-text-sub, #CBD5E1)",
    tabInactiveHoverBg: "var(--theme-hover-bg, #1F2937)",
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
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 32px 60px" }}>
        <div style={{ marginBottom: "24px" }}>
          <BackToDashboardLink href="/library" label="Back to Library" />
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 800,
              marginTop: "10px",
              marginBottom: "6px",
              color: themeStyles.color,
              transition: "color 0.3s",
            }}
          >
            My <span style={{ color: themeStyles.accent }}>Library</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: "0.9rem", fontWeight: 500, transition: "color 0.3s" }}>
            Everything you've saved, favorited, and are currently reading.
          </p>
        </div>

        {/* Inline Fully Synced Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "28px",
            scrollbarWidth: "none",
          }}
        >
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: isActive
                    ? "1px solid var(--theme-accent-border, #F59E0B)"
                    : `1px solid ${themeStyles.tabBorder}`,
                  background: isActive ? themeStyles.tabActiveBg : themeStyles.tabInactiveBg,
                  color: isActive ? themeStyles.tabActiveColor : themeStyles.tabInactiveColor,
                  boxShadow: isActive
                    ? "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))"
                    : "0 1px 2px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = themeStyles.tabInactiveHoverBg;
                    e.currentTarget.style.color = "var(--theme-text-main, #FFFFFF)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = themeStyles.tabInactiveBg;
                    e.currentTarget.style.color = themeStyles.tabInactiveColor;
                  }
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: themeStyles.subText, fontSize: "0.85rem", fontWeight: 600 }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{error}</p>
        ) : (
          <>
            {tab === "continue" && (
              <BookGrid
                books={continueBooks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                progressMap={progressMap}
                emptyMessage="Nothing in progress — open a book from the Library to start reading."
              />
            )}

            {tab === "favorites" && (
              <BookGrid
                books={favoriteBooks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                progressMap={progressMap}
                emptyMessage="No favorites yet — tap the 🏷️ icon on any book to favorite it."
              />
            )}

            {tab === "wishlist" && (
              <BookGrid
                books={wishlistBooks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                progressMap={progressMap}
                emptyMessage="Your wishlist is empty — tap the 🤍 icon on any book to add it."
              />
            )}

            {tab === "completed" && (
              <BookGrid
                books={completedBooks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                progressMap={progressMap}
                emptyMessage="No completed books yet."
              />
            )}

            {tab === "history" && (
              <BookGrid
                books={historyBooks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                progressMap={progressMap}
                emptyMessage="No reading history yet."
              />
            )}

            {tab === "collections" && (
              <CollectionsPanel collections={collections} onCollectionsChange={setCollections} books={books} />
            )}
          </>
        )}
      </div>
    </div>
  );
}