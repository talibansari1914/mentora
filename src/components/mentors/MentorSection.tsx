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
    <section style={{ marginBottom: "32px" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "14px" }}>{title}</h2>

      {mentors.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem" }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px" }}>
          {mentors.map((mentor) => (
            <div key={mentor.id} style={{ minWidth: "230px", maxWidth: "230px", flexShrink: 0 }}>
              <MentorCard mentor={mentor} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}