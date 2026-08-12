/*
Purpose:
Renders the input selection interface allowing users to either upload a video file 
or paste a YouTube URL, along with the output language dropdown.
Inputs:
- config: VideoNotesConfig
- onConfigChange: (updated: VideoNotesConfig) => void
- error: string | null
Returns:
JSX element for input selection.
Future:
Will include drag-and-drop file upload animations and video duration extraction.
*/

"use client";

import React, { useRef } from "react";
import { Upload, Video, Globe, AlertCircle, FileVideo, X } from "lucide-react";
import { VideoNotesConfig, InputSourceType, LanguageOption, UploadedVideoMeta } from "../types/videoNotes";
import { SUPPORTED_LANGUAGES } from "../constants/languages";
import { validateVideoFile, validateYouTubeUrl } from "../utils/validators";

interface InputSectionProps {
  config: VideoNotesConfig;
  onConfigChange: (config: VideoNotesConfig) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  config,
  onConfigChange,
  error,
  onErrorChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceSwitch = (sourceType: InputSourceType) => {
    onErrorChange(null);
    onConfigChange({
      ...config,
      sourceType,
    });
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateVideoFile(file);

    if (!validation.isValid) {
      onErrorChange(validation.error || "Invalid video file.");
      return;
    }

    onErrorChange(null);
    const videoMeta: UploadedVideoMeta = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    };

    onConfigChange({
      ...config,
      videoFile: videoMeta,
    });
  };

  const handleYoutubeUrlChange = (url: string) => {
    onConfigChange({
      ...config,
      youtubeUrl: url,
    });

    if (url.trim() && !validateYouTubeUrl(url)) {
      onErrorChange("Please enter a valid YouTube video URL (e.g., https://youtube.com/watch?v=...)");
    } else {
      onErrorChange(null);
    }
  };

  const handleLanguageChange = (language: LanguageOption) => {
    onConfigChange({
      ...config,
      language,
    });
  };

  const removeSelectedFile = () => {
    onConfigChange({
      ...config,
      videoFile: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        background: "var(--theme-card-bg)",
        border: "1px solid var(--theme-border)",
        borderRadius: "18px",
        padding: "24px",
        marginBottom: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Header & Source Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--theme-text-main)" }}>1. Select Input Source</h2>

        {/* Toggle tabs */}
        <div style={{ display: "flex", background: "var(--theme-bg-main)", padding: "4px", borderRadius: "12px", border: "1px solid var(--theme-border)" }}>
          <button
            onClick={() => handleSourceSwitch("upload")}
            disabled
            title="Coming soon — direct video upload isn't wired up to the AI yet. Please use a YouTube link for now."
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "none",
              background: "transparent",
              color: "var(--theme-text-sub)",
              opacity: 0.5,
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <Upload size={14} /> Upload Video (Soon)
          </button>
          <button
            onClick={() => handleSourceSwitch("youtube")}
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "none",
              background: config.sourceType === "youtube" ? "var(--theme-accent)" : "transparent",
              color: config.sourceType === "youtube" ? "var(--theme-accent-text)" : "var(--theme-text-sub)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <Video size={14} /> YouTube URL
          </button>
        </div>
      </div>

      {/* Input Section Body */}
      <div style={{ marginBottom: "20px" }}>
        {config.sourceType === "upload" ? (
          <div>
            {!config.videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--theme-border)",
                  borderRadius: "14px",
                  padding: "36px 20px",
                  textAlign: "center",
                  background: "var(--theme-bg-main)",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                }}
              >
                <FileVideo size={36} style={{ color: "var(--theme-accent)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--theme-text-main)", marginBottom: "4px" }}>
                  Click to upload video or drag and drop
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--theme-text-sub)" }}>
                  Supports MP4, MOV, AVI, WEBM (Max size: 500MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  style={{ display: "none" }}
                  onChange={handleFileDrop}
                />
              </div>
            ) : (
              <div
                style={{
                  background: "var(--theme-bg-main)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "var(--theme-accent-soft)", padding: "10px", borderRadius: "10px" }}>
                    <FileVideo size={20} style={{ color: "var(--theme-accent)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--theme-text-main)", marginBottom: "2px" }}>
                      {config.videoFile.name}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "var(--theme-text-sub)" }}>
                      {(config.videoFile.size / (1024 * 1024)).toFixed(2)} MB • {config.videoFile.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeSelectedFile}
                  style={{ background: "transparent", border: "none", color: "var(--theme-text-sub)", cursor: "pointer", padding: "6px" }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ position: "relative" }}>
              <Video size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--theme-accent)" }} />
              <input
                type="text"
                placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
                value={config.youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--theme-bg-main)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "12px",
                  padding: "12px 14px 12px 42px",
                  color: "var(--theme-text-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message banner */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "20px",
          }}
        >
          <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: "0.82rem", color: "#f87171" }}>{error}</span>
        </div>
      )}

      {/* Language Selection Dropdown */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text-main)", marginBottom: "8px" }}>
          <Globe size={15} style={{ color: "var(--theme-accent)" }} /> Output Language
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = config.language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: isSelected ? "1px solid var(--theme-accent)" : "1px solid var(--theme-border)",
                  background: isSelected ? "var(--theme-accent-soft)" : "var(--theme-bg-main)",
                  color: isSelected ? "var(--theme-accent)" : "var(--theme-text-sub)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};