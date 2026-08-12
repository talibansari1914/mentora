/*
Purpose:
Displays the generated notes summary, structured content, loading states, empty states, and download triggers.
Inputs:
- notesData: GeneratedNotesResult | null
- isLoading: boolean
Returns:
JSX element for notes presentation.
*/

"use client";

import React from "react";
import { FileText, Download, CheckCircle2, BookOpen, AlertCircle } from "lucide-react";
import { GeneratedNotesResult } from "../services/videoNotesApiClient";
import { jsPDF } from "jspdf";

interface NotesOutputSectionProps {
  notesData: GeneratedNotesResult | null;
  isLoading: boolean;
}

export const NotesOutputSection: React.FC<NotesOutputSectionProps> = ({
  notesData,
  isLoading,
}) => {
  // Guard: the VideoNotesData type allows `notes` to be a string, an array,
  // or `any` — but notesService.ts always builds it as a string today. This
  // coerces safely instead of crashing (e.g. calling .replace on an array)
  // if that ever changes. Shared by both download handlers below.
  const getNotesAsText = (notes: GeneratedNotesResult["notes"]): string => {
    if (typeof notes === "string") return notes;
    if (Array.isArray(notes)) {
      return notes.map((n) => (typeof n === "string" ? n : JSON.stringify(n))).join("\n");
    }
    return String(notes ?? "");
  };

  const handleDownloadPdf = () => {
    if (!notesData) return;
    const notesText = getNotesAsText(notesData.notes);

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mentora - AI Generated Notes", 20, 20);

    doc.setFontSize(12);
    doc.text(`Summary:`, 20, 35);
    doc.setFont("helvetica", "normal");
   doc.text(notesData.summary || "", 20, 45, { maxWidth: 170 });

    doc.setFont("helvetica", "bold");
    doc.text(`Detailed Notes:`, 20, 75);
    doc.setFont("helvetica", "normal");
    doc.text(notesText.replace(/###/g, "").replace(/\*\*/g, ""), 20, 85, { maxWidth: 170 });

    doc.save("mentora-notes.pdf");
  };

  const handleDownloadDocx = () => {
    if (!notesData) return;
    const notesText = getNotesAsText(notesData.notes);
    const content = `MENTORA AI NOTES\nGenerated on: ${notesData.generatedAt}\nLanguage: ${notesData.language}\n\nSUMMARY:\n${notesData.summary}\n\nNOTES:\n${notesText}`;
    const blob = new Blob([content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentora-notes.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "var(--theme-card-bg)",
          border: "1px solid var(--theme-border)",
          borderRadius: "18px",
          padding: "48px 20px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--theme-accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <BookOpen size={24} style={{ color: "var(--theme-accent)" }} className="mentora-pulse-icon" />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "6px" }}>
          Analyzing video and synthesizing notes...
        </h3>
        <p style={{ color: "var(--theme-text-sub)", fontSize: "0.85rem" }}>
          Our AI is extracting core concepts and formatting structured study material.
        </p>

        {/* Matches the rest of the app's pattern of scoped keyframe
            animations via style jsx (see signup/page.tsx, text-to-audio's
            page.tsx) instead of pulling in a Tailwind utility class for
            just this one icon. */}
        <style jsx>{`
          .mentora-pulse-icon {
            animation: mentora-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes mentora-pulse {
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  if (!notesData) {
    return (
      <div
        style={{
          background: "var(--theme-card-bg)",
          border: "1px solid var(--theme-border)",
          borderRadius: "18px",
          padding: "48px 20px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--theme-bg-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <FileText size={24} style={{ color: "var(--theme-text-sub)" }} />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main)", marginBottom: "6px" }}>No notes generated yet</h3>
        <p style={{ color: "var(--theme-text-sub)", fontSize: "0.85rem" }}>Provide a video file or YouTube URL above and click Generate Notes.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--theme-card-bg)", border: "1px solid var(--theme-border)", borderRadius: "18px", padding: "24px", boxSizing: "border-box" }}>
      {/* Header & Download Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--theme-border)",
          paddingBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={20} style={{ color: "#10b981" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main)" }}>Generated Notes ({notesData.language})</h2>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownloadPdf}
            style={{
              background: "var(--theme-bg-main)",
              border: "1px solid var(--theme-border)",
              color: "var(--theme-text-main)",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Download size={14} style={{ color: "var(--theme-accent)" }} /> PDF
          </button>
          <button
            onClick={handleDownloadDocx}
            style={{
              background: "var(--theme-bg-main)",
              border: "1px solid var(--theme-border)",
              color: "var(--theme-text-main)",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Download size={14} style={{ color: "var(--theme-accent)" }} /> DOCX
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)", borderRadius: "14px", padding: "16px", marginBottom: "20px", boxSizing: "border-box" }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--theme-accent)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
          Executive Summary
        </h4>
        <p style={{ color: "var(--theme-text-main)", fontSize: "0.9rem", lineHeight: "1.5" }}>{notesData.summary}</p>
      </div>

      {/* Detailed Notes Content */}
      <div>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--theme-accent)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
          Structured Notes
        </h4>
        <div
          style={{
            background: "var(--theme-bg-main)",
            border: "1px solid var(--theme-border)",
            borderRadius: "14px",
            padding: "20px",
            color: "var(--theme-text-main)",
            fontSize: "0.9rem",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            boxSizing: "border-box",
          }}
        >
          {getNotesAsText(notesData.notes)}
        </div>
      </div>
    </div>
  );
};