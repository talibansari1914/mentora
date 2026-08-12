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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#059669", fontSize: ".72rem", fontWeight: 700 }}>
          <Video size={12} /> Online
        </span>
      );
    if (mentor.mentorType === "offline")
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2563EB", fontSize: ".72rem", fontWeight: 700 }}>
          <MapPin size={12} /> Offline
        </span>
      );
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#7C3AED", fontSize: ".72rem", fontWeight: 700 }}>
        <Globe size={12} /> Hybrid
      </span>
    );
  };

  return (
    <>
      <style>{`
        .mentor-card-item {
          background: var(--theme-card-bg);
          border: 1px solid var(--theme-border);
          color: var(--theme-text-main);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
        }
        .mentor-card-item:hover {
          transform: translateY(-4px);
          border-color: var(--theme-accent);
          box-shadow: 0 10px 25px var(--theme-accent-glow);
        }

        .mentor-name-text {
          color: var(--theme-text-main);
        }

        .mentor-sub-text {
          color: var(--theme-text-sub);
        }

        .mentor-tag-item {
          background: var(--theme-hover-bg);
          border: 1px solid var(--theme-border);
          color: var(--theme-text-sub);
        }

        .mentor-footer-divider {
          border-top: 1px solid var(--theme-border);
        }
      `}</style>

      <div
        className="mentor-card-item"
        onClick={() => router.push(`/mentors/${mentor.id}`)}
        style={{
          borderRadius: "16px",
          padding: "18px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div>
          {/* Top row: Avatar & Basic Info */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                background: categoryColor(mentor.category),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                flexShrink: 0,
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4)",
              }}
            >
              {mentor.avatarIcon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" }}>
                <p
                  className="mentor-name-text"
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {mentor.name}
                </p>
                {mentor.verified && (
                  <span title="Verified Mentor" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={14} style={{ color: "#059669" }} />
                  </span>
                )}
              </div>
              <p
                className="mentor-sub-text"
                style={{
                  fontSize: ".76rem",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--theme-accent-soft)",
                border: "1px solid var(--theme-accent-border)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              <Star size={12} style={{ color: "var(--theme-accent)", fill: "var(--theme-accent)" }} />
              <span style={{ fontSize: ".78rem", fontWeight: 800, color: "var(--theme-accent)" }}>{mentor.rating}</span>
            </div>
            <span className="mentor-sub-text" style={{ fontSize: ".75rem", fontWeight: 500 }}>({mentor.totalStudents} students)</span>
          </div>

          {/* Expertise Tags */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {mentor.expertise.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="mentor-tag-item"
                style={{
                  fontSize: ".7rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  padding: "3px 8px",
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: Mode & Pricing */}
        <div
          className="mentor-footer-divider"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            marginTop: "auto",
          }}
        >
          <div>{getModeBadge()}</div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontWeight: 800, color: "var(--theme-accent)", fontSize: ".92rem" }}>₹{mentor.sessionCharge}</span>
            <span className="mentor-sub-text" style={{ fontSize: ".68rem", display: "block", fontWeight: 500 }}>per session</span>
          </div>
        </div>
      </div>
    </>
  );
}