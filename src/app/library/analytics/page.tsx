"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { EXAMS } from "@/constants/library";
import { libraryService } from "@/services/libraryService";
import { bookService } from "@/services/bookService";
import { LibraryProgress, Book } from "@/types/book";

import AnalyticsSummaryCards from "@/components/library/AnalyticsSummaryCards";
import SubjectProgressChart from "@/components/library/SubjectProgressChart";

export default function LibraryAnalyticsPage() {
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rows, allBooks] = await Promise.all([
          libraryService.getAllProgress(),
          bookService.getAllBooks(),
        ]);
        setProgress(rows);
        setBooks(allBooks);
      } catch (err: any) {
        setError(err.message ?? "Could not load your reading analytics.");
      } finally {
        setLoading(false);
      }
    })();
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

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif", padding: "32px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link href="/library" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
          ← Back to Library
        </Link>

        <header style={{ margin: "14px 0 22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Reading <span style={G.gradText}>Analytics</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            How much you've read and where you're focused.
          </p>
        </header>

        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "#EF4444", fontSize: ".85rem" }}>{error}</p>
        ) : booksStarted === 0 ? (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", color: "#64748B" }}>
            No reading activity yet — open a book from the Library to start tracking progress.
          </div>
        ) : (
          <>
            <AnalyticsSummaryCards
              booksStarted={booksStarted}
              booksCompleted={booksCompleted}
              completionPercent={completionPercent}
              estimatedPagesRead={estimatedPagesRead}
            />

            <div style={{ marginBottom: "20px" }}>
              <SubjectProgressChart data={subjectProgress} />
            </div>

            {recentlyActive.length > 0 && (
              <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "16px" }}>Recently Active</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recentlyActive.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < recentlyActive.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: ".88rem", fontWeight: 600 }}>{row.book?.title}</p>
                        <p style={{ color: "#64748B", fontSize: ".75rem" }}>
                          {new Date(row.lastOpened).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: ".85rem" }}>
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
        <div style={{ ...G.card, padding: "16px 20px", color: "#64748B", fontSize: ".8rem", lineHeight: 1.6 }}>
          ℹ️ Reading Time and Daily Reading Streak aren't shown yet — they need a live PDF/EPUB reader
          to track actual time spent per session, which isn't built yet. Once book files are added,
          this page will pick those up automatically.
        </div>
      </div>
    </div>
  );
}