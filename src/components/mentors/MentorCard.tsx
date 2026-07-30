"use client";

import { useRouter } from "next/navigation";
import { categoryColor } from "@/constants/mentors";
import { Mentor } from "@/types/mentor";
import { CheckCircle2, Star, Video, MapPin, Globe } from "lucide-react";

export default function MentorCard({ mentor }: { mentor: Mentor }) {
  const router = useRouter();

  const getModeBadge = () => {
    if (mentor.mentorType === "online")
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#34d399", fontSize: ".72rem", fontWeight: 600 }}>
          <Video size={12} /> Online
        </span>
      );
    if (mentor.mentorType === "offline")
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#60a5fa", fontSize: ".72rem", fontWeight: 600 }}>
          <MapPin size={12} /> Offline
        </span>
      );
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#c084fc", fontSize: ".72rem", fontWeight: 600 }}>
        <Globe size={12} /> Hybrid
      </span>
    );
  };

  return (
    <div
      onClick={() => router.push(`/mentors/${mentor.id}`)}
      style={{
        background: "linear-gradient(145deg, #0b0f17 0%, #131b2e 100%)",
        border: "1px solid #2d3748",
        borderRadius: "18px",
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-6px)";
        el.style.borderColor = "#f59e0b";
        el.style.boxShadow = "0 12px 32px rgba(245, 158, 11, 0.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "#2d3748";
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      }}
    >
      <div>
        {/* Top row: Avatar & Basic Info */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: categoryColor(mentor.category),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.7rem",
              flexShrink: 0,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
            }}
          >
            {mentor.avatarIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "0.98rem",
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mentor.name}
              </p>
              {mentor.verified && (
                <span title="Verified Mentor" style={{ display: "inline-flex", alignItems: "center" }}>
                  <CheckCircle2 size={15} style={{ color: "#34d399", flexShrink: 0 }} />
                </span>
                )}
            </div>
            <p
              style={{
                color: "#a0aec0",
                fontSize: ".78rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}
            >
              {mentor.qualification}
            </p>
          </div>
        </div>

        {/* Rating & Students pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            <Star size={13} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
            <span style={{ fontSize: ".8rem", fontWeight: 800, color: "#f59e0b" }}>{mentor.rating}</span>
          </div>
          <span style={{ color: "#718096", fontSize: ".78rem", fontWeight: 500 }}>({mentor.totalStudents} students)</span>
        </div>

        {/* Expertise Tags */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {mentor.expertise.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: ".72rem",
                fontWeight: 600,
                color: "#cbd5e1",
                background: "#161f31",
                border: "1px solid #2d3748",
                borderRadius: "8px",
                padding: "4px 10px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Mode & Pricing */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(45, 55, 72, 0.6)",
          paddingTop: "12px",
          marginTop: "auto",
        }}
      >
        <div>{getModeBadge()}</div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: ".95rem" }}>₹{mentor.sessionCharge}</span>
          <span style={{ color: "#718096", fontSize: ".7rem", display: "block" }}>per session</span>
        </div>
      </div>
    </div>
  );
}