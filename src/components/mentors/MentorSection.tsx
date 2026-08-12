"use client";

import { Mentor } from "@/types/mentor";
import MentorCard from "./MentorCard";

interface MentorSectionProps {
  title: string;
  mentors: Mentor[];
  emptyMessage?: string;
}

export default function MentorSection({ title, mentors, emptyMessage }: MentorSectionProps) {
  if (mentors.length === 0 && !emptyMessage) return null;

  return (
    <section style={{ marginBottom: "32px", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .mentor-section-title {
          color: var(--theme-text-main);
        }

        .mentor-empty-msg {
          color: var(--theme-text-sub);
        }
      `}</style>

      <h2
        className="mentor-section-title"
        style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "14px" }}
      >
        {title}
      </h2>

      {mentors.length === 0 ? (
        <p className="mentor-empty-msg" style={{ fontSize: ".85rem", fontWeight: 500 }}>
          {emptyMessage}
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "14px",
            overflowX: "auto",
            paddingBottom: "8px",
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {mentors.map((mentor) => (
            <div key={mentor.id} style={{ minWidth: "250px", maxWidth: "250px", flexShrink: 0 }}>
              <MentorCard mentor={mentor} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}