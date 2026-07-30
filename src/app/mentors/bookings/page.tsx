"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { G } from "@/constants/colors";
import { mentorService } from "@/services/mentorService";
import { MentorBooking, Mentor } from "@/types/mentor";

type Tab = "upcoming" | "past" | "cancelled";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#22C55E",
  completed: "#38BDF8",
  cancelled: "#EF4444",
};

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: n <= value ? "#F59E0B" : "#334155" }}
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

      // Figure out which completed bookings already have a review, across
      // every mentor involved, so "Rate Mentor" doesn't show twice.
      const uniqueMentorIds = [...new Set(myBookings.map((b) => b.mentor_id))];
      const reviewLists = await Promise.all(uniqueMentorIds.map((id) => mentorService.getReviewsForMentor(id)));
      const reviewed = new Set<string>();
      reviewLists.flat().forEach((r) => {
        if (r.booking_id) reviewed.add(r.booking_id);
      });
      setReviewedBookingIds(reviewed);
    } catch (err: any) {
      setError(err.message ?? "Could not load your bookings.");
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
    } catch (err: any) {
      alert(err.message ?? "Could not cancel this session.");
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
    } catch (err: any) {
      alert(err.message ?? "Could not submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.08)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".85rem",
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif", padding: "32px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/mentors" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
          ← Back to Mentors
        </Link>

        <header style={{ margin: "14px 0 22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            My <span style={G.gradText}>Bookings</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>Your mentor sessions, past and upcoming.</p>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
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

        {error && <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{error}</p>}

        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
        ) : activeList.length === 0 ? (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", color: "#64748B" }}>
            No {tab} sessions.{" "}
            {tab === "upcoming" && (
              <Link href="/mentors" style={{ color: "#F59E0B", textDecoration: "none" }}>
                Find a mentor →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {activeList.map((booking) => {
              const mentor = mentors[booking.mentor_id];
              const alreadyReviewed = reviewedBookingIds.has(booking.id);

              return (
                <div key={booking.id} style={{ ...G.card, padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontSize: "1.6rem" }}>{mentor?.avatarIcon ?? "🎓"}</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: ".92rem" }}>{mentor?.name ?? "Mentor"}</p>
                        <p style={{ color: "#64748B", fontSize: ".78rem" }}>{booking.session_type}</p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: ".68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: STATUS_COLORS[booking.status],
                        background: `${STATUS_COLORS[booking.status]}1A`,
                        border: `1px solid ${STATUS_COLORS[booking.status]}40`,
                        borderRadius: "100px",
                        padding: "3px 10px",
                      }}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", color: "#94A3B8", fontSize: ".8rem", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span>📅 {new Date(booking.booking_date).toDateString()}</span>
                    <span>🕐 {booking.booking_time}</span>
                    <span>⏱️ {booking.duration_minutes} min</span>
                    <span>{booking.mode === "online" ? "🟢 Online" : "🔵 Offline"}</span>
                  </div>

                  {booking.notes && (
                    <p style={{ color: "#64748B", fontSize: ".8rem", marginBottom: "10px" }}>Note: {booking.notes}</p>
                  )}

                  {booking.meeting_link && booking.status === "confirmed" && (
                    <a
                      href={booking.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", color: "#F59E0B", fontSize: ".82rem", textDecoration: "none", marginBottom: "10px" }}
                    >
                      🔗 Join Session
                    </a>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    {tab === "upcoming" && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        style={{ background: "transparent", border: "1px solid rgba(239,68,68,.3)", color: "#EF4444", padding: "7px 16px", borderRadius: "8px", fontSize: ".78rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Cancel Session
                      </button>
                    )}

                    {tab === "past" && booking.status === "completed" && !alreadyReviewed && (
                      <button
                        onClick={() => setReviewingId(reviewingId === booking.id ? null : booking.id)}
                        style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", color: "#F59E0B", padding: "7px 16px", borderRadius: "8px", fontSize: ".78rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Rate Mentor
                      </button>
                    )}

                    {alreadyReviewed && <span style={{ color: "#22C55E", fontSize: ".78rem" }}>✓ Reviewed</span>}
                  </div>

                  {reviewingId === booking.id && (
                    <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                      <RatingStars value={reviewRating} onChange={setReviewRating} />
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="How was your session? (optional)"
                        rows={2}
                        style={{ width: "100%", marginTop: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "10px 12px", color: "white", fontSize: ".85rem", resize: "vertical", fontFamily: "inherit" }}
                      />
                      <button
                        onClick={() => handleSubmitReview(booking)}
                        disabled={submittingReview}
                        style={{ marginTop: "10px", background: G.grad, border: "none", color: "#111827", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, fontSize: ".8rem", cursor: submittingReview ? "not-allowed" : "pointer" }}
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