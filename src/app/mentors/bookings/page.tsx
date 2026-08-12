"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mentorService } from "@/services/mentorService";
import { MentorBooking, Mentor } from "@/types/mentor";
import { Zap, Calendar, Clock, Video, Star, CheckCircle2 } from "lucide-react";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

type Tab = "upcoming" | "past" | "cancelled";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  confirmed: { color: "#059669", bg: "rgba(5,150,105,0.1)" },
  completed: { color: "#0284C7", bg: "rgba(2,132,199,0.1)" },
  cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.3rem",
            color: n <= value ? "var(--theme-accent)" : "var(--theme-text-sub)",
            padding: 0,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<MentorBooking[]>([]);
  const [mentors, setMentors] = useState<Record<number, Mentor>>({});
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [myBookings, allMentors] = await Promise.all([
        mentorService.getMyBookings(),
        mentorService.getAllMentors(),
      ]);

      setBookings(myBookings);

      const mentorMap: Record<number, Mentor> = {};
      allMentors.forEach((m) => (mentorMap[m.id] = m));
      setMentors(mentorMap);

      const uniqueMentorIds = [...new Set(myBookings.map((b) => b.mentor_id))];
      const reviewLists = await Promise.all(uniqueMentorIds.map((id) => mentorService.getReviewsForMentor(id)));
      const reviewed = new Set<string>();
      reviewLists.flat().forEach((r) => {
        if (r.booking_id) reviewed.add(r.booking_id);
      });
      setReviewedBookingIds(reviewed);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not load your bookings."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const upcoming = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed" && b.booking_date >= today),
    [bookings, today]
  );
  const past = useMemo(
    () => bookings.filter((b) => b.status === "completed" || (b.status !== "cancelled" && b.booking_date < today)),
    [bookings, today]
  );
  const cancelled = useMemo(() => bookings.filter((b) => b.status === "cancelled"), [bookings]);

  const activeList = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this session?")) return;
    try {
      await mentorService.cancelBooking(bookingId);
      loadAll();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Could not cancel this session."));
    }
  }

  async function handleSubmitReview(booking: MentorBooking) {
    setSubmittingReview(true);
    try {
      await mentorService.submitReview({
        mentor_id: booking.mentor_id,
        booking_id: booking.id,
        rating: reviewRating,
        review_text: reviewText.trim() || undefined,
      });
      setReviewingId(null);
      setReviewText("");
      setReviewRating(5);
      loadAll();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Could not submit review."));
    } finally {
      setSubmittingReview(false);
    }
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "10px 18px",
    borderRadius: "12px",
    border: active ? "1px solid var(--theme-accent)" : "1px solid var(--theme-border)",
    background: active ? "var(--theme-accent)" : "var(--theme-card-bg)",
    color: active ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
    fontWeight: 700,
    fontSize: ".88rem",
    cursor: "pointer",
    boxShadow: active ? "0 4px 14px var(--theme-accent-glow)" : "none",
    transition: "all 0.2s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--theme-bg-main)",
        color: "var(--theme-text-main)",
        fontFamily: "'Inter', sans-serif",
        paddingBottom: "60px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          background: "var(--theme-card-bg)",
          borderBottom: "1px solid var(--theme-border)",
          padding: "14px clamp(16px, 4vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "var(--theme-text-main)",
            fontWeight: 800,
            fontSize: "1.2rem",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--theme-accent)",
              color: "var(--theme-accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <Zap size={16} style={{ color: "var(--theme-accent-text)" }} />
          </div>
          Mentora
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/mentors"
            style={{ color: "var(--theme-text-sub)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
          >
            Browse Mentors
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "32px auto 0 auto", padding: "0 clamp(12px, 4vw, 20px)", boxSizing: "border-box" }}>
        <div style={{ marginBottom: "16px" }}>
          <BackToDashboardLink href="/mentors" label="Back to Mentors" />
        </div>

        <header style={{ margin: "14px 0 24px" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              marginBottom: "8px",
              color: "var(--theme-text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            My <span style={{ color: "var(--theme-accent)" }}>Bookings</span>
          </h1>
          <p style={{ color: "var(--theme-text-sub)", fontSize: ".95rem", fontWeight: 500 }}>
            Your mentor sessions, past and upcoming.
          </p>
        </header>

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "upcoming")} onClick={() => setTab("upcoming")}>
            Upcoming ({upcoming.length})
          </button>
          <button style={tabBtn(tab === "past")} onClick={() => setTab("past")}>
            Past ({past.length})
          </button>
          <button style={tabBtn(tab === "cancelled")} onClick={() => setTab("cancelled")}>
            Cancelled ({cancelled.length})
          </button>
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: ".88rem", marginBottom: "16px", fontWeight: 600 }}>⚠️ {error}</p>}

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
            Loading sessions...
          </div>
        ) : activeList.length === 0 ? (
          <div
            style={{
              background: "var(--theme-card-bg)",
              border: "1px solid var(--theme-border)",
              borderRadius: "20px",
              padding: "clamp(28px, 6vw, 48px)",
              textAlign: "center",
              color: "var(--theme-text-sub)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "12px" }}>No {tab} sessions found.</p>
            {tab === "upcoming" && (
              <Link href="/mentors" style={{ color: "var(--theme-accent)", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
                Find a mentor →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {activeList.map((booking) => {
              const mentor = mentors[booking.mentor_id];
              const alreadyReviewed = reviewedBookingIds.has(booking.id);
              const statusInfo = STATUS_COLORS[booking.status] || { color: "var(--theme-text-sub)", bg: "var(--theme-hover-bg)" };

              return (
                <div
                  key={booking.id}
                  style={{
                    background: "var(--theme-card-bg)",
                    border: "1px solid var(--theme-border)",
                    borderRadius: "20px",
                    padding: "clamp(16px, 4vw, 24px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: "var(--theme-accent-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                        }}
                      >
                        {mentor?.avatarIcon ?? "🎓"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--theme-text-main)", marginBottom: "2px" }}>
                          {mentor?.name ?? "Mentor"}
                        </p>
                        <p style={{ color: "var(--theme-text-sub)", fontSize: ".82rem", fontWeight: 600 }}>{booking.session_type}</p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: ".75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: statusInfo.color,
                        background: statusInfo.bg,
                        borderRadius: "100px",
                        padding: "4px 12px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", color: "var(--theme-text-sub)", fontSize: ".85rem", marginBottom: "14px", flexWrap: "wrap", fontWeight: 500 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>📅 {new Date(booking.booking_date).toDateString()}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>🕐 {booking.booking_time}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>⏱️ {booking.duration_minutes} min</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>{booking.mode === "online" ? "🟢 Online" : "🔵 Offline"}</span>
                  </div>

                  {booking.notes && (
                    <p
                      style={{
                        color: "var(--theme-text-sub)",
                        fontSize: ".85rem",
                        marginBottom: "14px",
                        background: "var(--theme-bg-main)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--theme-border)",
                      }}
                    >
                      <strong>Note:</strong> {booking.notes}
                    </p>
                  )}

                  {booking.meeting_link && booking.status === "confirmed" && (
                    <a
                      href={booking.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--theme-accent)",
                        fontSize: ".88rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        marginBottom: "14px",
                      }}
                    >
                      🔗 Join Session
                    </a>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                    {tab === "upcoming" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: ".82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Cancel Session
                      </button>
                    )}

                    {tab === "past" && booking.status === "completed" && !alreadyReviewed && (
                      <button
                        type="button"
                        onClick={() => setReviewingId(reviewingId === booking.id ? null : booking.id)}
                        style={{
                          background: "var(--theme-accent-soft)",
                          border: "1px solid var(--theme-accent-border)",
                          color: "var(--theme-accent)",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: ".82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Rate Mentor
                      </button>
                    )}

                    {alreadyReviewed && (
                      <span style={{ color: "#059669", fontSize: ".82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={16} /> Reviewed
                      </span>
                    )}
                  </div>

                  {reviewingId === booking.id && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--theme-border)" }}>
                      <RatingStars value={reviewRating} onChange={setReviewRating} />
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="How was your session? (optional)"
                        rows={3}
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          background: "var(--theme-card-bg)",
                          border: "1px solid var(--theme-border)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          color: "var(--theme-text-main)",
                          fontSize: ".88rem",
                          resize: "vertical",
                          fontFamily: "inherit",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(booking)}
                        disabled={submittingReview}
                        style={{
                          marginTop: "12px",
                          background: "var(--theme-accent)",
                          border: "none",
                          color: "var(--theme-accent-text)",
                          padding: "10px 20px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: ".85rem",
                          cursor: submittingReview ? "not-allowed" : "pointer",
                          boxShadow: "0 4px 12px var(--theme-accent-glow)",
                        }}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}