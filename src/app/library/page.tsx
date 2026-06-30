"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" },
};

const USER = { initials: "RS", name: "Rahul Singh" };

// ══════════════════════════════════════════
// 👇 DUMMY BOOK DATA — baad mein backend se aayega
// ══════════════════════════════════════════
const EXAMS = ["All", "UPSC", "JEE", "NEET", "SSC", "Engineering"];
const TYPES = ["All Types", "Books", "Notes", "PYQs", "Magazines", "Newspapers"];

const BOOKS = [
  { id: 1, title: "Indian Polity", author: "M. Laxmikanth", exam: "UPSC", type: "Books", pages: 754, rating: 4.8, downloads: "120K", color: "linear-gradient(135deg,#6366F1,#8B5CF6)", icon: "📘", new: false, premium: false },
  { id: 2, title: "Indian Economy", author: "Ramesh Singh", exam: "UPSC", type: "Books", pages: 612, rating: 4.7, downloads: "98K", color: "linear-gradient(135deg,#F59E0B,#EF4444)", icon: "📗", new: false, premium: false },
  { id: 3, title: "Certificate Physical Geography", author: "G.C. Leong", exam: "UPSC", type: "Books", pages: 432, rating: 4.6, downloads: "76K", color: "linear-gradient(135deg,#06B6D4,#3B82F6)", icon: "📙", new: false, premium: false },
  { id: 4, title: "NCERT Physics Class 12", author: "NCERT", exam: "JEE", type: "Books", pages: 380, rating: 4.9, downloads: "210K", color: "linear-gradient(135deg,#EC4899,#F43F5E)", icon: "📕", new: false, premium: false },
  { id: 5, title: "Organic Chemistry Handbook", author: "MS Chouhan", exam: "JEE", type: "Notes", pages: 156, rating: 4.5, downloads: "65K", color: "linear-gradient(135deg,#10B981,#059669)", icon: "📓", new: true, premium: true },
  { id: 6, title: "NEET Biology Master Notes", author: "Trueman's", exam: "NEET", type: "Notes", pages: 290, rating: 4.8, downloads: "145K", color: "linear-gradient(135deg,#8B5CF6,#6366F1)", icon: "📔", new: false, premium: false },
  { id: 7, title: "Lucent's General Knowledge", author: "Lucent Publications", exam: "SSC", type: "Books", pages: 540, rating: 4.6, downloads: "180K", color: "linear-gradient(135deg,#F97316,#F59E0B)", icon: "📒", new: false, premium: false },
  { id: 8, title: "UPSC Prelims PYQs 2015-2025", author: "Mentora Team", exam: "UPSC", type: "PYQs", pages: 220, rating: 4.9, downloads: "92K", color: "linear-gradient(135deg,#3B82F6,#06B6D4)", icon: "🗂️", new: true, premium: false },
  { id: 9, title: "JEE Advanced PYQs 2010-2025", author: "Mentora Team", exam: "JEE", type: "PYQs", pages: 310, rating: 4.8, downloads: "134K", color: "linear-gradient(135deg,#EF4444,#F97316)", icon: "🗂️", new: true, premium: false },
  { id: 10, title: "Yojana Magazine — June 2026", author: "Govt. of India", exam: "UPSC", type: "Magazines", pages: 68, rating: 4.4, downloads: "41K", color: "linear-gradient(135deg,#059669,#10B981)", icon: "📰", new: true, premium: false },
  { id: 11, title: "The Hindu Editorial Digest", author: "Mentora Team", exam: "UPSC", type: "Newspapers", pages: 45, rating: 4.7, downloads: "88K", color: "linear-gradient(135deg,#6366F1,#3B82F6)", icon: "📰", new: false, premium: false },
  { id: 12, title: "GATE CS Previous Papers", author: "Mentora Team", exam: "Engineering", type: "PYQs", pages: 198, rating: 4.6, downloads: "53K", color: "linear-gradient(135deg,#8B5CF6,#EC4899)", icon: "🗂️", new: false, premium: true },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      <span style={{ color: "#F59E0B", fontSize: "0.75rem" }}>★</span>
      <span style={{ fontSize: "0.75rem", color: "#CBD5E1", fontWeight: 600 }}>{rating}</span>
    </div>
  );
}

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    return BOOKS.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
      const matchExam = examFilter === "All" || b.exam === examFilter;
      const matchType = typeFilter === "All Types" || b.type === typeFilter;
      return matchSearch && matchExam && matchType;
    });
  }, [search, examFilter, typeFilter]);

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,20,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 32px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>⚡</div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
            </Link>
            <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "#64748B", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
              ← Back to Dashboard
            </Link>
          </div>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#080C14" }}>
            {USER.initials}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 32px 60px" }}>

        {/* Title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "6px" }}>Digital Library</h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>{BOOKS.length}+ books, notes, PYQs and magazines — all in one place.</p>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "13px 18px", marginBottom: "20px", maxWidth: "560px", transition: "border 0.2s" }}
          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.4)"}
          onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"}>
          <span style={{ fontSize: "1rem", color: "#64748B" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by book title or author..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {/* Exam filter */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {EXAMS.map(ex => (
              <button key={ex} onClick={() => setExamFilter(ex)} style={{
                padding: "7px 16px", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                border: examFilter === ex ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                background: examFilter === ex ? G.grad : "#111827",
                color: examFilter === ex ? "#080C14" : "#94A3B8",
                transition: "all 0.2s",
              }}>{ex}</button>
            ))}
          </div>
          {/* Type filter */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
                border: typeFilter === t ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)",
                background: typeFilter === t ? "rgba(245,158,11,0.1)" : "transparent",
                color: typeFilter === t ? "#F59E0B" : "#64748B",
                transition: "all 0.2s",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: "18px" }}>
          Showing <strong style={{ color: "#CBD5E1" }}>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Book Grid */}
        {filtered.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px" }}>
            {filtered.map(book => (
              <div key={book.id} style={{ ...G.card, padding: "0", overflow: "hidden", transition: "all 0.25s", cursor: "pointer", display: "flex", flexDirection: "column" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>

                {/* Cover */}
                <div style={{ position: "relative", height: "140px", background: book.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.8rem" }}>
                  {book.icon}
                  {book.new && (
                    <span style={{ position: "absolute", top: "10px", left: "10px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", background: "#080C14", color: "#F59E0B", padding: "3px 9px", borderRadius: "100px", border: "1px solid rgba(245,158,11,0.4)" }}>New</span>
                  )}
                  {book.premium && (
                    <span style={{ position: "absolute", top: "10px", left: book.new ? "52px" : "10px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", background: "rgba(99,102,241,0.9)", color: "white", padding: "3px 9px", borderRadius: "100px" }}>Pro</span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleBookmark(book.id); }} style={{
                    position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(8,12,20,0.6)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
                    color: bookmarked.includes(book.id) ? "#F59E0B" : "white",
                  }}>
                    {bookmarked.includes(book.id) ? "🔖" : "🏷️"}
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", marginBottom: "3px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{book.title}</p>
                    <p style={{ fontSize: "0.74rem", color: "#64748B" }}>{book.author}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "100px", padding: "2px 8px" }}>{book.exam}</span>
                    <span style={{ fontSize: "0.62rem", color: "#64748B" }}>{book.pages}p</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "6px" }}>
                    <StarRating rating={book.rating} />
                    <span style={{ fontSize: "0.68rem", color: "#475569", fontFamily: "monospace" }}>↓ {book.downloads}</span>
                  </div>

                  <button style={{
                    marginTop: "6px", padding: "9px", borderRadius: "9px", border: "none", cursor: "pointer",
                    background: book.premium ? "rgba(99,102,241,0.12)" : "rgba(245,158,11,0.1)",
                    color: book.premium ? "#818CF8" : "#F59E0B",
                    fontSize: "0.8rem", fontWeight: 700, transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = book.premium ? "#6366F1" : G.grad; (e.currentTarget as HTMLElement).style.color = book.premium ? "white" : "#080C14"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = book.premium ? "rgba(99,102,241,0.12)" : "rgba(245,158,11,0.1)"; (e.currentTarget as HTMLElement).style.color = book.premium ? "#818CF8" : "#F59E0B"; }}>
                    {book.premium ? "🔒 Unlock with Pro" : "Read Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>No results found</h3>
            <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:1100px){
          div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(3,1fr)!important}
        }
        @media(max-width:768px){
          div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}
          div[style*="padding: 36px 32px"]{padding:24px 16px!important}
        }
        @media(max-width:480px){
          div[style*="repeat(4,1fr)"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}