"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { categoryColor } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { Mentor, MentorReviewWithReviewer } from "@/types/mentor";
import { Zap, Star, MapPin, CheckCircle2, Calendar as CalendarIcon, Clock, ShieldCheck, MessageSquare } from "lucide-react";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const TIME_SLOT_GROUPS: { period: string; slots: string[] }[] = [
  { period: "Morning", slots: ["09:00 AM", "10:00 AM", "11:00 AM"] },
  { period: "Afternoon", slots: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"] },
  { period: "Evening", slots: ["04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"] },
  { period: "Night", slots: ["08:00 PM", "09:00 PM"] },
];

const FAQS = [
  { q: "What platform do you use for the sessions?", a: "Sessions are conducted online via high-quality video conferencing links provided upon booking confirmation." },
  { q: "Do you provide session recordings?", a: "Yes, cloud recordings are shared automatically right after the session concludes." },
  { q: "Can I reschedule my session?", a: "Yes, you can reschedule up to 12 hours before the scheduled time directly from your dashboard." },
];

const SESSION_OFFERS = [
  { title: "1-on-1 Live Session", duration: "30 mins", desc: "Personalized one-on-one mentorship session", price: 999 },
  { title: "Career Guidance", duration: "30 mins", desc: "Get expert advice on your career path & growth", price: 799 },
  { title: "Resume Review", duration: "20 mins", desc: "Get your resume reviewed by an industry expert", price: 499 },
  { title: "Mock Interview", duration: "60 mins", desc: "Practice interviews & get detailed feedback", price: 1499 },
];

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const mentorId = Number(params?.id);

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [reviews, setReviews] = useState<MentorReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedSessionOffer, setSelectedSessionOffer] = useState(SESSION_OFFERS[0].title);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonthDate]);

  function handlePrevMonth() {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  useEffect(() => {
    if (!isMounted || !mentorId) return;

    let cancelled = false;

    (async () => {
      try {
        const [foundMentor, mentorReviews] = await Promise.all([
          mentorService.getMentorById(mentorId),
          mentorService.getReviewsForMentor(mentorId),
        ]);
        if (cancelled) return;
        if (!foundMentor) {
          setError("Mentor not found.");
          return;
        }
        setMentor(foundMentor);
        setReviews(mentorReviews);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load this mentor."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMounted, mentorId]);

  useEffect(() => {
    if (!mentor) return;
    let cancelled = false;
    setCheckingSlots(true);
    setSelectedTime(null);
    const dateStr = selectedDate.toISOString().split("T")[0];
    mentorService
      .getBookedSlots(mentor.id, dateStr)
      .then((slots) => {
        if (!cancelled) setBookedSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setCheckingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mentor, selectedDate]);

  if (!isMounted) {
    return <div style={{ minHeight: "100vh", background: "var(--theme-bg-main)" }} />;
  }

  async function handleBook() {
    if (!mentor || !selectedTime) {
      setBookingError("Please select a time slot.");
      return;
    }

    // Defense-in-depth: the calendar UI already disables past dates, but we
    // check again here in case selectedDate ever gets set some other way.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (selectedDate < startOfToday) {
      setBookingError("Please select a valid upcoming date.");
      return;
    }

    setBooking(true);
    setBookingError(null);
    try {
      await mentorService.createBooking({
        mentor_id: mentor.id,
        session_type: selectedSessionOffer,
        mode: mentor.mentorType === "offline" ? "offline" : "online",
        booking_date: selectedDate.toISOString().split("T")[0],
        booking_time: selectedTime,
        duration_minutes: selectedSessionOffer.includes("60") ? 60 : 30,
        notes: notes.trim() || undefined,
      });
      setBookingSuccess(true);
    } catch (err: unknown) {
      setBookingError(getErrorMessage(err, "Could not complete the booking."));
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main)",
          color: "var(--theme-text-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "var(--theme-card-bg)",
            color: "var(--theme-text-main)",
            border: "1px solid var(--theme-border)",
            borderRadius: "20px",
            padding: "30px 40px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          Loading mentor profile...
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main)",
          color: "var(--theme-text-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "var(--theme-card-bg)",
            color: "var(--theme-text-main)",
            border: "1px solid var(--theme-border)",
            borderRadius: "20px",
            padding: "36px",
            textAlign: "center",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ marginBottom: "20px", color: "#EF4444", fontSize: "0.95rem", fontWeight: 600 }}>{error ?? "Mentor not found."}</p>
          <Link href="/mentors" style={{ color: "var(--theme-accent)", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--theme-bg-main)",
          color: "var(--theme-text-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "var(--theme-card-bg)",
            color: "var(--theme-text-main)",
            border: "1px solid var(--theme-border)",
            borderRadius: "24px",
            padding: "40px",
            textAlign: "center",
            maxWidth: "460px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "10px", color: "var(--theme-text-main)" }}>Session Requested!</h2>
          <p style={{ color: "var(--theme-text-sub)", fontSize: "0.9rem", marginBottom: "24px", lineHeight: 1.6 }}>
            Your session with <strong style={{ color: "var(--theme-text-main)" }}>{mentor.name}</strong> on{" "}
            <span style={{ color: "var(--theme-accent)", fontWeight: 700 }}>{selectedDate.toDateString()}</span> at{" "}
            <span style={{ color: "var(--theme-accent)", fontWeight: 700 }}>{selectedTime}</span> has been requested successfully.
          </p>
          <Link
            href="/mentors/bookings"
            style={{
              display: "inline-block",
              background: "var(--theme-accent)",
              color: "var(--theme-accent-text)",
              padding: "12px 24px",
              borderRadius: "14px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "0.9rem",
              boxShadow: "0 4px 14px var(--theme-accent-glow)",
            }}
          >
            View My Bookings →
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Main Unified Card Container */}
      <div style={{ maxWidth: "1100px", margin: "32px auto 0 auto", padding: "0 clamp(12px, 4vw, 16px)", boxSizing: "border-box" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "16px" }}>
          <BackToDashboardLink href="/mentors" label="Back to Mentors" />
        </div>

        <div
          style={{
            background: "var(--theme-card-bg)",
            color: "var(--theme-text-main)",
            border: "1px solid var(--theme-border)",
            borderRadius: "24px",
            padding: "clamp(16px, 4vw, 40px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            boxSizing: "border-box",
          }}
        >
          {/* 1. Profile Header Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "24px",
              borderBottom: "1px solid var(--theme-border)",
              paddingBottom: "32px",
            }}
          >
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "20px",
                  background: categoryColor(mentor.category),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  border: "1px solid var(--theme-border)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                {mentor.avatarIcon}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "var(--theme-text-main)", letterSpacing: "-0.02em" }}>
                    {mentor.name}
                  </h1>
                  {mentor.verified && (
                    <span
                      style={{
                        background: "rgba(5, 150, 105, 0.1)",
                        color: "#059669",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "1px solid rgba(5, 150, 105, 0.25)",
                      }}
                    >
                      <CheckCircle2 size={12} /> Verified Expert
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--theme-accent)", fontSize: "1.05rem", marginTop: "6px", fontWeight: 700 }}>
                  {mentor.qualification || "Staff Infrastructure Engineer"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", fontSize: "0.88rem", color: "var(--theme-text-sub)", flexWrap: "wrap", fontWeight: 500 }}>
                  <span style={{ color: "var(--theme-accent)", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Star size={14} fill="currentColor" style={{ color: "var(--theme-accent)" }} /> {mentor.rating} ({reviews.length} reviews)
                  </span>
                  <span>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={14} /> {mentor.city || "San Francisco, CA"}
                  </span>
                  <span>•</span>
                  <span style={{ color: "#059669", fontWeight: 700 }}>⚡ Response time: &lt; 2 hrs</span>
                </div>
              </div>
            </div>

            {/* Right Pricing Action Box */}
            <div
              style={{
                background: "var(--theme-bg-main)",
                border: "1px solid var(--theme-border)",
                padding: "20px 28px",
                borderRadius: "20px",
                textAlign: "center",
                minWidth: "240px",
                width: "100%",
                maxWidth: "280px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--theme-text-sub)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Starting At
              </span>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--theme-text-main)", margin: "4px 0" }}>
                ₹{mentor.sessionCharge || 1499} <span style={{ fontSize: "0.75rem", color: "var(--theme-text-sub)", fontWeight: 500 }}>/ session</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#059669", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: 600 }}>
                <ShieldCheck size={12} /> 100% money-back guarantee
              </p>
            </div>
          </div>

          {/* Stat Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
            {[
              { value: "1,420+", label: "Sessions", color: "var(--theme-text-main)" },
              { value: "980+", label: "Mentees", color: "var(--theme-text-main)" },
              { value: "4.95 ★", label: "Rating", color: "var(--theme-accent)" },
              { value: "12+ Yrs", label: "Experience", color: "var(--theme-text-main)" },
              { value: "94%", label: "Repeat Clients", color: "var(--theme-text-main)" },
              { value: "< 2h", label: "Response Time", color: "#059669" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "var(--theme-bg-main)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "14px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--theme-text-sub)", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* 2. About & Expertise */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "12px", color: "var(--theme-accent)" }}>About {mentor.name}</h2>
              <p style={{ color: "var(--theme-text-sub)", fontSize: "0.9rem", lineHeight: 1.7, fontWeight: 500 }}>{mentor.bio}</p>
            </div>

            <div style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "12px", color: "var(--theme-accent)" }}>Skills & Expertise</h2>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {mentor.expertise?.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--theme-text-main)",
                      background: "var(--theme-card-bg)",
                      border: "1px solid var(--theme-border)",
                      borderRadius: "100px",
                      padding: "6px 14px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Session Offers */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "6px", color: "var(--theme-text-main)" }}>Select Session Type</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub)", marginBottom: "16px", fontWeight: 500 }}>
              Choose the package that fits your exact growth goal
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {SESSION_OFFERS.map((offer) => {
                const isSelected = selectedSessionOffer === offer.title;
                return (
                  <div
                    key={offer.title}
                    onClick={() => setSelectedSessionOffer(offer.title)}
                    style={{
                      background: isSelected ? "var(--theme-accent-soft)" : "var(--theme-bg-main)",
                      border: isSelected ? "2px solid var(--theme-accent)" : "1px solid var(--theme-border)",
                      borderRadius: "18px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: isSelected ? "0 4px 16px var(--theme-accent-glow)" : "0 1px 3px rgba(0,0,0,0.02)",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "4px" }}>{offer.title}</h3>
                      <p style={{ fontSize: "0.78rem", color: "var(--theme-accent)", fontWeight: 800, marginBottom: "8px" }}>{offer.duration}</p>
                      <p style={{ fontSize: "0.82rem", color: "var(--theme-text-sub)", lineHeight: 1.5, marginBottom: "16px", fontWeight: 500 }}>{offer.desc}</p>
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--theme-text-main)" }}>₹{offer.price}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Calendar & Time Slots Section */}
          <div style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "20px", padding: "clamp(16px, 4vw, 28px)", boxSizing: "border-box" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "20px", color: "var(--theme-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarIcon size={20} style={{ color: "var(--theme-accent)" }} /> Schedule Your Date & Time
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", alignItems: "start" }}>
              {/* Calendar Widget */}
              <div style={{ background: "var(--theme-card-bg)", border: "1px solid var(--theme-border)", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", boxSizing: "border-box" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--theme-text-main)" }}>
                    {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={handlePrevMonth}
                      style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", color: "var(--theme-text-main)", padding: "4px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNextMonth}
                      style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", color: "var(--theme-text-main)", padding: "4px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", marginBottom: "10px" }}>
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} style={{ fontSize: "0.7rem", color: "var(--theme-accent)", fontWeight: 800 }}>
                      {d}
                    </span>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                  {calendarGrid.map((dateObj, idx) => {
                    if (!dateObj) return <div key={`empty-${idx}`} />;
                    const isSelected = dateObj.toDateString() === selectedDate.toDateString();
                    const isToday = dateObj.toDateString() === new Date().toDateString();
                    // Compare at day granularity (midnight-to-midnight) so "today"
                    // itself is always bookable regardless of the current time.
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    const isPast = dateObj < startOfToday;

                    return (
                      <button
                        key={dateObj.toISOString()}
                        onClick={() => !isPast && setSelectedDate(dateObj)}
                        disabled={isPast}
                        style={{
                          padding: "10px 0",
                          borderRadius: "10px",
                          border: isSelected
                            ? "1.5px solid var(--theme-text-main)"
                            : isToday
                            ? "1px dashed var(--theme-accent)"
                            : "1px solid var(--theme-border)",
                          background: isSelected ? "var(--theme-accent)" : "var(--theme-card-bg)",
                          color: isPast ? "var(--theme-muted-text)" : isSelected ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
                          fontWeight: isSelected ? 900 : 600,
                          fontSize: "0.8rem",
                          cursor: isPast ? "not-allowed" : "pointer",
                          textAlign: "center",
                          opacity: isPast ? 0.4 : 1,
                        }}
                      >
                        {dateObj.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={16} style={{ color: "var(--theme-accent)" }} /> Available Slots for {selectedDate.toDateString()}
                </p>

                {checkingSlots ? (
                  <p style={{ color: "var(--theme-text-sub)", fontSize: "0.85rem", padding: "16px 0", fontWeight: 500 }}>Checking availability...</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                    {TIME_SLOT_GROUPS.map((group) => (
                      <div key={group.period}>
                        <p style={{ color: "var(--theme-accent)", fontSize: "0.72rem", marginBottom: "6px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {group.period}
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {group.slots.map((slot) => {
                            const isTaken = bookedSlots.includes(slot);
                            const isSelected = selectedTime === slot;
                            return (
                              <button
                                key={slot}
                                disabled={isTaken}
                                onClick={() => setSelectedTime(slot)}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  border: isSelected ? "1.5px solid var(--theme-text-main)" : "1px solid var(--theme-border)",
                                  background: isTaken ? "var(--theme-hover-bg)" : isSelected ? "var(--theme-accent)" : "var(--theme-card-bg)",
                                  color: isTaken ? "var(--theme-text-sub)" : isSelected ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
                                  fontSize: "0.82rem",
                                  fontWeight: isSelected ? 900 : 700,
                                  cursor: isTaken ? "not-allowed" : "pointer",
                                  textDecoration: isTaken ? "line-through" : "none",
                                }}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "16px" }}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes or specific topics to focus on..."
                    style={{
                      width: "100%",
                      background: "var(--theme-card-bg)",
                      border: "1px solid var(--theme-border)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "var(--theme-text-main)",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {bookingError && <p style={{ color: "#EF4444", fontSize: ".82rem", marginTop: "8px", fontWeight: 600 }}>⚠️ {bookingError}</p>}

                <button
                  onClick={handleBook}
                  disabled={booking || !selectedTime}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    background: selectedTime ? "var(--theme-accent)" : "var(--theme-border)",
                    border: "none",
                    color: selectedTime ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
                    padding: "14px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: booking || !selectedTime ? "not-allowed" : "pointer",
                    boxShadow: selectedTime ? "0 4px 16px var(--theme-accent-glow)" : "none",
                  }}
                >
                  {booking ? "Processing..." : selectedTime ? `Confirm Booking for ${selectedTime}` : "Select a Time Slot"}
                </button>
              </div>
            </div>
          </div>

          {/* 5. Reviews Section */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "16px", color: "var(--theme-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Star size={18} fill="currentColor" style={{ color: "var(--theme-accent)" }} /> Reviews & Ratings ({reviews.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {reviews.map((rev, index) => {
                const rName = rev.reviewer_name || "Mentee";
                const rComment = rev.review_text || "";
                const rRating = Math.max(0, Math.min(5, Math.round(rev.rating ?? 5)));

                return (
                  <div key={rev.id ?? index} style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "16px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--theme-card-bg)",
                            border: "1px solid var(--theme-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            color: "var(--theme-accent)",
                            flexShrink: 0,
                          }}
                        >
                          {rName[0] ?? "U"}
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--theme-text-main)" }}>{rName}</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "var(--theme-accent)", fontWeight: 800 }}>{"★".repeat(rRating)}</span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--theme-text-sub)", lineHeight: 1.5, fontWeight: 500 }}>{rComment}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. FAQs Section */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "16px", color: "var(--theme-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={18} style={{ color: "var(--theme-accent)" }} /> Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FAQS.map((faq, index) => (
                <div key={index} style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "14px", padding: "18px" }}>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "6px" }}>{faq.q}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--theme-text-sub)", lineHeight: 1.5, fontWeight: 500 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}