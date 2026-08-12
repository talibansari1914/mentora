"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EXAMS } from "@/constants/library";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import { settingsService } from "@/services/settingsService";
import { formatDate, type DateFormat } from "@/lib/dateFormat";
import { LibraryProgress, Book } from "@/types/book";

import AnalyticsSummaryCards from "@/components/library/AnalyticsSummaryCards";
import SubjectProgressChart from "@/components/library/SubjectProgressChart";
import { getErrorMessage } from "@/lib/errors";

export default function LibraryAnalyticsPage() {
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [rows, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          bookService.getAllBooks(),
        ]);
        if (cancelled) return;
        setProgress(rows);
        setBooks(allBooks);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load your reading analytics."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((settings) => {
        if (!cancelled) setDateFormat(settings.language_region.dateFormat as DateFormat);
      })
      .catch(() => {
        // Not fatal — this page still works with the default format.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const progressMap = useMemo(() => {
    const map: Record<number, number> = {};
    progress.forEach((p) => {
      map[Number(p.book_id)] = p.progress_percent;
    });
    return map;
  }, [progress]);

  const booksStarted = progress.filter((p) => p.progress_percent > 0).length;
  const booksCompleted = progress.filter((p) => p.progress_percent >= 100).length;
  const completionPercent = booksStarted > 0 ? Math.round((booksCompleted / booksStarted) * 100) : 0;

  // Estimated, not exact — calculated as (book's total pages) × (% read),
  // summed across every book that has some progress. This is a real
  // calculation from real data, just an estimate rather than an exact
  // page-by-page count (which would need a live PDF reader to track).
  const estimatedPagesRead = useMemo(() => {
    return books.reduce((total, book) => {
      const pct = progressMap[book.id] ?? 0;
      return total + Math.round(book.pages * (pct / 100));
    }, 0);
  }, [progressMap, books]);

  const subjectProgress = useMemo(() => {
    return EXAMS.filter((e) => e !== "All").map((exam) => {
      const booksInExam = books.filter((b) => b.exam === exam);
      const totalPct = booksInExam.reduce((sum, b) => sum + (progressMap[b.id] ?? 0), 0);
      const avg = booksInExam.length > 0 ? Math.round(totalPct / booksInExam.length) : 0;
      return { exam, avgProgress: avg, bookCount: booksInExam.length };
    });
  }, [progressMap, books]);

  const recentlyActive = useMemo(() => {
    return [...progress]
      .filter((p) => p.last_opened_at)
      .sort((a, b) => new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime())
      .slice(0, 5)
      .map((p) => ({
        book: books.find((b) => b.id === Number(p.book_id)),
        progress: p.progress_percent,
        lastOpened: p.last_opened_at,
      }))
      .filter((row) => !!row.book);
  }, [progress, books]);

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    cardBg: "var(--theme-card-bg, #111827)",
    cardBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    divider: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: `1px solid ${themeStyles.cardBorder}`,
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px 20px",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link
          href="/library"
          style={{
            color: themeStyles.subText,
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "12px",
            transition: "color 0.3s",
          }}
        >
          ← Back to Library
        </Link>

        <header style={{ marginBottom: "22px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: themeStyles.color,
              marginBottom: "8px",
              transition: "color 0.3s",
            }}
          >
            Reading <span style={{ color: "var(--theme-accent, #D97706)" }}>Analytics</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: "0.95rem", transition: "color 0.3s" }}>
            How much you've read and where you're focused.
          </p>
        </header>

        {loading ? (
          <p style={{ color: themeStyles.subText, fontSize: "0.85rem", fontWeight: 500 }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{error}</p>
        ) : booksStarted === 0 ? (
          <div
            style={{
              ...cardStyle,
              padding: "40px",
              textAlign: "center",
              color: themeStyles.subText,
              fontSize: "0.9rem",
              marginBottom: "20px",
            }}
          >
            No reading activity yet — open a book from the Library to start tracking progress.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <AnalyticsSummaryCards
                booksStarted={booksStarted}
                booksCompleted={booksCompleted}
                completionPercent={completionPercent}
                estimatedPagesRead={estimatedPagesRead}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <SubjectProgressChart data={subjectProgress} />
            </div>

            {recentlyActive.length > 0 && (
              <div style={{ ...cardStyle, padding: "22px", marginBottom: "20px" }}>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: themeStyles.color,
                    marginBottom: "16px",
                    transition: "color 0.3s",
                  }}
                >
                  Recently Active
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recentlyActive.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < recentlyActive.length - 1 ? themeStyles.divider : "none",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: themeStyles.color,
                            margin: 0,
                            transition: "color 0.3s",
                          }}
                        >
                          {row.book?.title}
                        </p>
                        <p style={{ color: themeStyles.subText, fontSize: "0.75rem", margin: "2px 0 0 0" }}>
                          {formatDate(row.lastOpened, dateFormat)}
                        </p>
                      </div>
                      <span style={{ color: "var(--theme-accent, #D97706)", fontWeight: 800, fontSize: "0.85rem" }}>
                        {row.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Honesty note about what isn't tracked yet */}
        <div
          style={{
            ...cardStyle,
            padding: "16px 20px",
            color: themeStyles.subText,
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
        >
          ℹ️ Reading Time and Daily Reading Streak aren't shown yet — they need a live PDF/EPUB reader
          to track actual time spent per session, which isn't built yet. Once book files are added,
          this page will pick those up automatically.
        </div>
      </div>
    </div>
  );
}