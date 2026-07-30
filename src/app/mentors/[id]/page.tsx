"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { categoryColor } from "@/constants/mentors";
import { mentorService } from "@/services/mentorService";
import { Mentor, MentorReview } from "@/types/mentor";
import { Zap, Star, MapPin, CheckCircle2, Calendar as CalendarIcon, Clock, ArrowLeft, ShieldCheck, MessageSquare } from "lucide-react";

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
  const [reviews, setReviews] = useState<MentorReview[]>([]);
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
    (async () => {
      try {
        const [foundMentor, mentorReviews] = await Promise.all([
          mentorService.getMentorById(mentorId),
          mentorService.getReviewsForMentor(mentorId),
        ]);
        if (!foundMentor) {
          setError("Mentor not found.");
          return;
        }
        setMentor(foundMentor);
        setReviews(mentorReviews);
      } catch (err: any) {
        setError(err.message ?? "Could not load this mentor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isMounted, mentorId]);

  useEffect(() => {
    if (!mentor) return;
    setCheckingSlots(true);
    setSelectedTime(null);
    const dateStr = selectedDate.toISOString().split("T")[0];
    mentorService
      .getBookedSlots(mentor.id, dateStr)
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]))
      .finally(() => setCheckingSlots(false));
  }, [mentor, selectedDate]);

  if (!isMounted) {
    return <div style={{ minHeight: "100vh", background: "#06090e" }} />;
  }

  async function handleBook() {
    if (!mentor || !selectedTime) {
      setBookingError("Please select a time slot.");
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
    } catch (err: any) {
      setBookingError(err.message ?? "Could not complete the booking.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#06090e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: "#0b0f17", color: "white", border: "1px solid #2d3748", borderRadius: "20px", padding: "30px 40px" }}>
          Loading mentor profile...
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div style={{ minHeight: "100vh", background: "#06090e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: "#0b0f17", color: "white", border: "1px solid #2d3748", borderRadius: "20px", padding: "36px", textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <p style={{ marginBottom: "20px", color: "#f87171", fontSize: "0.95rem" }}>{error ?? "Mentor not found."}</p>
          <Link href="/mentors" style={{ color: "#f59e0b", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div style={{ minHeight: "100vh", background: "#06090e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: "#0b0f17", color: "white", border: "1px solid #2d3748", borderRadius: "24px", padding: "40px", textAlign: "center", maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "10px", color: "white" }}>Session Requested!</h2>
          <p style={{ color: "#a0aec0", fontSize: "0.9rem", marginBottom: "24px", lineHeight: 1.6 }}>
            Your session with <strong style={{ color: "white" }}>{mentor.name}</strong> on <span style={{ color: "#f59e0b" }}>{selectedDate.toDateString()}</span> at <span style={{ color: "#f59e0b" }}>{selectedTime}</span> has been requested successfully.
          </p>
          <Link
            href="/mentors/bookings"
            style={{ display: "inline-block", background: "#f59e0b", color: "#000000", padding: "12px 24px", borderRadius: "14px", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}
          >
            View My Bookings →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#06090e", color: "#ffffff", fontFamily: "'Inter', sans-serif", paddingBottom: "60px" }}>
      
      {/* Top Navbar */}
      <nav style={{ background: "#0b0f17", borderBottom: "1px solid #2d3748", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "white", fontWeight: 800, fontSize: "1.2rem" }}>
          <div style={{ width: "28px", height: "28px", background: "#f59e0b", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>
            <Zap size={16} style={{ color: "#000" }} />
          </div>
          Mentora
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/mentors" style={{ color: "#a0aec0", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>Browse Mentors</Link>
        </div>
      </nav>

      {/* Main Unified Card Container */}
      <div style={{ maxWidth: "1100px", margin: "32px auto 0 auto", padding: "0 20px" }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: "16px" }}>
          <Link href="/mentors" style={{ color: "#a0aec0", fontSize: "0.88rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to Mentors
          </Link>
        </div>

        <div style={{ background: "#0b0f17", color: "white", border: "1px solid #2d3748", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* 1. Profile Header Row matching screenshot inspiration */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px", borderBottom: "1px solid #2d3748", paddingBottom: "32px" }}>
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
                  border: "2px solid #2d3748",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
                }}
              >
                {mentor.avatarIcon}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{mentor.name}</h1>
                  {mentor.verified && (
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      <CheckCircle2 size={12} /> Verified Expert
                    </span>
                  )}
                </div>
                <p style={{ color: "#f59e0b", fontSize: "1.05rem", marginTop: "6px", fontWeight: 700 }}>{mentor.qualification || "Staff Infrastructure Engineer"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", fontSize: "0.88rem", color: "#a0aec0", flexWrap: "wrap" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Star size={14} fill="#f59e0b" /> {mentor.rating} ({reviews.length} reviews)
                  </span>
                  <span>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={14} /> {mentor.city || "San Francisco, CA"}
                  </span>
                  <span>•</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>⚡ Response time: &lt; 2 hrs</span>
                </div>
              </div>
            </div>

            {/* Right Pricing Action Box matching Stripe/Vercel Vibe */}
            <div style={{ background: "#161f31", border: "1px solid #2d3748", padding: "20px 28px", borderRadius: "20px", textAlign: "center", minWidth: "240px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.08em" }}>Starting At</span>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", margin: "4px 0" }}>
                ${mentor.sessionCharge || 149} <span style={{ fontSize: "0.75rem", color: "#a0aec0", fontWeight: 500 }}>/ session</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: 600 }}>
                <ShieldCheck size={12} /> 100% money-back guarantee
              </p>
            </div>
          </div>

          {/* Stat Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>1,420+</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Sessions</div>
            </div>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>980+</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Mentees</div>
            </div>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f59e0b" }}>4.95 ★</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Rating</div>
            </div>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>12+ Yrs</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Experience</div>
            </div>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>94%</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Repeat Clients</div>
            </div>
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10b981" }}>&lt; 2h</div>
              <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", marginTop: "2px", fontWeight: 700 }}>Response Time</div>
            </div>
          </div>

          {/* 2. About & Expertise */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }} className="about-skills-grid">
            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px", color: "#f59e0b" }}>About {mentor.name}</h2>
              <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.7 }}>{mentor.bio}</p>
            </div>

            <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "20px", padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px", color: "#f59e0b" }}>Skills & Expertise</h2>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {mentor.expertise?.map((tag) => (
                  <span key={tag} style={{ fontSize: "0.78rem", fontWeight: 700, color: "#000000", background: "#f59e0b", borderRadius: "100px", padding: "6px 14px" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Session Offers */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "6px", color: "white" }}>Select Session Type</h2>
            <p style={{ fontSize: "0.85rem", color: "#a0aec0", marginBottom: "16px" }}>Choose the package that fits your exact growth goal</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {SESSION_OFFERS.map((offer) => {
                const isSelected = selectedSessionOffer === offer.title;
                return (
                  <div
                    key={offer.title}
                    onClick={() => setSelectedSessionOffer(offer.title)}
                    style={{
                      background: isSelected ? "rgba(245,158,11,0.12)" : "#161f31",
                      border: isSelected ? "2px solid #f59e0b" : "1px solid #2d3748",
                      borderRadius: "18px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "white", marginBottom: "4px" }}>{offer.title}</h3>
                      <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 700, marginBottom: "8px" }}>{offer.duration}</p>
                      <p style={{ fontSize: "0.82rem", color: "#a0aec0", lineHeight: 1.5, marginBottom: "16px" }}>{offer.desc}</p>
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "white" }}>₹{offer.price}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Calendar & Time Slots Section */}
          <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "20px", padding: "28px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "20px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarIcon size={20} style={{ color: "#f59e0b" }} /> Schedule Your Date & Time
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr", gap: "28px", alignItems: "start" }} className="calendar-grid-container">
              
              {/* Calendar Widget */}
              <div style={{ background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
                    {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={handlePrevMonth} style={{ background: "#161f31", border: "1px solid #2d3748", color: "white", padding: "4px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>‹</button>
                    <button onClick={handleNextMonth} style={{ background: "#161f31", border: "1px solid #2d3748", color: "white", padding: "4px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>›</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", marginBottom: "10px" }}>
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 800 }}>{d}</span>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                  {calendarGrid.map((dateObj, idx) => {
                    if (!dateObj) return <div key={`empty-${idx}`} />;
                    const isSelected = dateObj.toDateString() === selectedDate.toDateString();
                    const isToday = dateObj.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={dateObj.toISOString()}
                        onClick={() => setSelectedDate(dateObj)}
                        style={{
                          padding: "10px 0",
                          borderRadius: "10px",
                          border: isSelected ? "1.5px solid #000000" : isToday ? "1px dashed #f59e0b" : "1px solid #2d3748",
                          background: isSelected ? "#f59e0b" : "#161f31",
                          color: isSelected ? "#000000" : "#a0aec0",
                          fontWeight: isSelected ? 900 : 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          textAlign: "center"
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
                <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={16} style={{ color: "#f59e0b" }} /> Available Slots for {selectedDate.toDateString()}
                </p>

                {checkingSlots ? (
                  <p style={{ color: "#a0aec0", fontSize: "0.85rem", padding: "16px 0" }}>Checking availability...</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                    {TIME_SLOT_GROUPS.map((group) => (
                      <div key={group.period}>
                        <p style={{ color: "#f59e0b", fontSize: "0.72rem", marginBottom: "6px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.period}</p>
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
                                  border: isSelected ? "1.5px solid #000000" : "1px solid #2d3748",
                                  background: isTaken ? "rgba(255,255,255,0.02)" : isSelected ? "#f59e0b" : "#0b0f17",
                                  color: isTaken ? "#4a5568" : isSelected ? "#000000" : "#a0aec0",
                                  fontSize: "0.82rem",
                                  fontWeight: isSelected ? 900 : 700,
                                  cursor: isTaken ? "not-allowed" : "pointer",
                                  textDecoration: isTaken ? "line-through" : "none"
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
                    style={{ width: "100%", background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "12px", padding: "12px 14px", color: "white", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {bookingError && <p style={{ color: "#f87171", fontSize: ".82rem", marginTop: "8px", fontWeight: 600 }}>⚠️ {bookingError}</p>}

                <button
                  onClick={handleBook}
                  disabled={booking || !selectedTime}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    background: selectedTime ? "#f59e0b" : "#2d3748",
                    border: "none",
                    color: selectedTime ? "#000000" : "#a0aec0",
                    padding: "14px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: booking || !selectedTime ? "not-allowed" : "pointer",
                    boxShadow: selectedTime ? "0 4px 16px rgba(245,158,11,0.35)" : "none"
                  }}
                >
                  {booking ? "Processing..." : selectedTime ? `Confirm Booking for ${selectedTime}` : "Select a Time Slot"}
                </button>
              </div>

            </div>
          </div>

          {/* 5. Reviews Section */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "16px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <Star size={18} fill="#f59e0b" style={{ color: "#f59e0b" }} /> Reviews & Ratings ({reviews.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {reviews.map((rev, index) => {
                const rName = (rev as any).userName || (rev as any).user_name || (rev as any).name || "Mentee";
                const rComment = (rev as any).comment || (rev as any).feedback || (rev as any).review || "";
                const rRating = rev.rating ?? 5;

                return (
                  <div key={rev.id ?? index} style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "16px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0b0f17", border: "1px solid #2d3748", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", color: "#f59e0b" }}>
                          {rName[0] ?? "U"}
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>{rName}</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: 800 }}>{"★".repeat(rRating)}</span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.5 }}>{rComment}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. FAQs Section */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "16px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={18} style={{ color: "#f59e0b" }} /> Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FAQS.map((faq, index) => (
                <div key={index} style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "18px" }}>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "white", marginBottom: "6px" }}>{faq.q}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#a0aec0", lineHeight: 1.5 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}