/*
Purpose:
Main page component for the Video-to-Notes module. Integrates input configuration, 
generation handler, and output display state.
Inputs:
N/A (Page route component)
Returns:
Complete Video-to-Notes MVP page layout.
*/

"use client";

import React, { useState } from "react";
import { VideoNotesConfig } from "./types/videoNotes";
import { InputSection } from "./components/InputSection";
import { GenerateButton } from "./components/GenerateButton";
import { NotesOutputSection } from "./components/NotesOutputSection";
import { generateNotesApi, GeneratedNotesResult } from "./services/videoNotesApiClient";
import { validateYouTubeUrl } from "./utils/validators";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

export default function VideoToNotesPage() {
  const [config, setConfig] = useState<VideoNotesConfig>({
    sourceType: "upload",
    videoFile: null,
    youtubeUrl: "",
    language: "English",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notesData, setNotesData] = useState<GeneratedNotesResult | null>(null);

  const isFormValid = Boolean(
    (config.sourceType === "upload" && config.videoFile) ||
    (config.sourceType === "youtube" && config.youtubeUrl?.trim() && validateYouTubeUrl(config.youtubeUrl))
  );

  const handleGenerateNotes = async () => {
    if (isLoading) return; // Ignore repeat clicks while a request is already in flight

    // Pick the right identifier based on sourceType (uploaded file or YouTube URL)
    const identifier = config.sourceType === "upload" 
      ? config.videoFile 
      : config.youtubeUrl;

    if (!identifier) {
      setError("Please provide a valid video file or YouTube URL.");
      return;
    }

    try {
      setIsLoading(true); // Start loading
      setError(null);

      const result = await generateNotesApi(
        config.sourceType || "video",
        identifier,
        config.language || "English"
      );

      setNotesData(result); // Save the notes data to state so the output section renders it
      
    } catch (err: unknown) {
      console.error("Failed to generate notes:", err);
      setError(getErrorMessage(err, "Failed to generate notes from AI. Please try again later."));
    } finally {
      setIsLoading(false); // Done loading
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--theme-bg-main)", color: "var(--theme-text-main)", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--theme-card-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--theme-border)",
          padding: "14px clamp(14px, 4vw, 20px)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <BackToDashboardLink inline />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--theme-accent)" }}>Video to Notes (MVP)</span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px clamp(12px, 4vw, 20px) 60px", boxSizing: "border-box" }}>
        {/* Title Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.7rem)", fontWeight: 800, marginBottom: "4px", color: "var(--theme-text-main)" }}>Video to Notes</h1>
          <p style={{ color: "var(--theme-text-sub)", fontSize: ".88rem" }}>
            Upload a lecture video or paste a YouTube link to instantly generate structured AI study notes.
          </p>
        </div>

        {/* Input Component */}
        <InputSection
          config={config}
          onConfigChange={setConfig}
          error={error}
          onErrorChange={setError}
        />

        {/* Generate Button Component */}
        <GenerateButton
          onClick={handleGenerateNotes}
          isLoading={isLoading}
          disabled={!isFormValid || isLoading}
        />

        {/* Output Section Component */}
        <NotesOutputSection
          notesData={notesData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}