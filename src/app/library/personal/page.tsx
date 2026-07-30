"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import { LibraryProgress, Collection, Book } from "@/types/book";

import PersonalLibraryTabs, { PersonalTab } from "@/components/library/PersonalLibraryTabs";
import BookGrid from "@/components/library/BookGrid";
import CollectionsPanel from "@/components/library/CollectionsPanel";

export default function PersonalLibraryPage() {
  const [tab, setTab] = useState<PersonalTab>("continue");
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [progressRows, collectionRows, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          libraryService.getCollections(),
          bookService.getAllBooks(),
        ]);
        setProgress(progressRows);
        setBooks(allBooks);
        setCollections(collectionRows);
      } catch (err: any) {
        setError(err.message ?? "Could not load your library.");
      } finally {
        setLoading(false);
      }
    })();
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
      console.error("Could not save favorite:", (err as any)?.message ?? err);
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
      console.error("Could not save wishlist:", (err as any)?.message ?? err);
    }
  }

  // Derives each tab's book list from the same `progress` rows —
  // no extra queries needed, just different filters on data already loaded.
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

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 32px 60px" }}>
        <div style={{ marginBottom: "24px" }}>
          <Link href="/library" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
            ← Back to Library
          </Link>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, marginTop: "10px", marginBottom: "6px" }}>
            My <span style={G.gradText}>Library</span>
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>
            Everything you've saved, favorited, and are currently reading.
          </p>
        </div>

        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "#EF4444", fontSize: ".85rem" }}>{error}</p>
        ) : (
          <>
            <PersonalLibraryTabs active={tab} onChange={setTab} />

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