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
import { GeneratedNotesResult } from "../services/notesService";
import { jsPDF } from "jspdf";

interface NotesOutputSectionProps {
  notesData: GeneratedNotesResult | null;
  isLoading: boolean;
}

export const NotesOutputSection: React.FC<NotesOutputSectionProps> = ({
  notesData,
  isLoading,
}) => {
  const handleDownloadPdf = () => {
    if (!notesData) return;
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
    doc.text(notesData.notes.replace(/###/g, "").replace(/\*\*/g, ""), 20, 85, { maxWidth: 170 });

    doc.save("mentora-notes.pdf");
  };

  const handleDownloadDocx = () => {
    if (!notesData) return;
    const content = `MENTORA AI NOTES\nGenerated on: ${notesData.generatedAt}\nLanguage: ${notesData.language}\n\nSUMMARY:\n${notesData.summary}\n\nNOTES:\n${notesData.notes}`;
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
      <div style={{ background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "18px", padding: "48px 20px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <BookOpen size={24} style={{ color: "#f59e0b" }} className="animate-pulse" />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", marginBottom: "6px" }}>Analyzing video and synthesizing notes...</h3>
        <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Our AI is extracting core concepts and formatting structured study material.</p>
      </div>
    );
  }

  if (!notesData) {
    return (
      <div style={{ background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "18px", padding: "48px 20px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#161f31", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <FileText size={24} style={{ color: "#94A3B8" }} />
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", marginBottom: "6px" }}>No notes generated yet</h3>
        <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Provide a video file or YouTube URL above and click Generate Notes.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#0b0f17", border: "1px solid #2d3748", borderRadius: "18px", padding: "24px" }}>
      
      {/* Header & Download Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #2d3748", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={20} style={{ color: "#10b981" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}>Generated Notes ({notesData.language})</h2>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownloadPdf}
            style={{
              background: "#161f31",
              border: "1px solid #2d3748",
              color: "white",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <Download size={14} style={{ color: "#f59e0b" }} /> PDF
          </button>
          <button
            onClick={handleDownloadDocx}
            style={{
              background: "#161f31",
              border: "1px solid #2d3748",
              color: "white",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <Download size={14} style={{ color: "#f59e0b" }} /> DOCX
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
          Executive Summary
        </h4>
        <p style={{ color: "#e2e8f0", fontSize: "0.9rem", lineHeight: "1.5" }}>{notesData.summary}</p>
      </div>

      {/* Detailed Notes Content */}
      <div>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
          Structured Notes
        </h4>
        <div style={{ background: "#161f31", border: "1px solid #2d3748", borderRadius: "14px", padding: "20px", color: "#e2e8f0", fontSize: "0.9rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {notesData.notes}
        </div>
      </div>

    </div>
  );
};