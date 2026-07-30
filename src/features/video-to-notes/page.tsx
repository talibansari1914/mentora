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
import Link from "next/link";
import { VideoNotesConfig } from "./types/videoNotes";
import { InputSection } from "./components/InputSection";
import { GenerateButton } from "./components/GenerateButton";
import { NotesOutputSection } from "./components/NotesOutputSection";
import { generateNotesApi, GeneratedNotesResult } from "./services/notesService";
import { validateYouTubeUrl } from "./utils/validators";

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
    if (isLoading) return; // Agar pehle se load ho raha hai toh dubara click na ho

    // Sahi identifier select karo based on sourceType (upload file ya youtube url)
    const identifier = config.sourceType === "upload" 
      ? config.videoFile 
      : config.youtubeUrl;

    if (!identifier) {
      setError("Please provide a valid video file or YouTube URL.");
      return;
    }

    try {
      setIsLoading(true); // Loading shuru
      setError(null);

      const result = await generateNotesApi(
        config.sourceType || "video",
        identifier,
        config.language || "English"
      );

      console.log("Success:", result);
      setNotesData(result); // Notes data ko state me save kar diya taaki output section me dikhe
      
    } catch (err: any) {
      console.error("Failed to generate notes:", err);
      setError(err.message || "Failed to generate notes from AI. Please try again later.");
    } finally {
      setIsLoading(false); // Loading khatam
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06090e", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Top Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11, 15, 23, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #2d3748",
          padding: "14px 20px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" style={{ color: "#94A3B8", fontSize: ".85rem", textDecoration: "none", fontWeight: 600 }}>
            ← Dashboard
          </Link>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>Video to Notes (MVP)</span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px 60px" }}>
        
        {/* Title Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "4px", color: "white" }}>Video to Notes</h1>
          <p style={{ color: "#a0aec0", fontSize: ".88rem" }}>
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