"use client";

import React, { useEffect, useState } from "react";

export default function ReadAloud({ text }: { text: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  // The browser only reports available voices asynchronously, and the list
  // differs by OS/browser — this loads whatever the user's system provides.
  useEffect(() => {
    function loadVoices() {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (list.length > 0 && !selectedVoice) {
        setSelectedVoice(list[0].name);
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlay() {
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = speed;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function handlePauseResume() {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  const selectStyle: React.CSSProperties = {
    background: "var(--theme-card-bg, #FFFFFF)",
    border: "1px solid var(--theme-border, #CBD5E1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--theme-text-main, #0F172A)",
    fontSize: "0.88rem",
    outline: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
  };

  return (
    <div>
      {voices.length === 0 ? (
        <div
          style={{
            background: "var(--theme-hover-bg, #F8FAFC)",
            border: "1px solid var(--theme-border, #E2E8F0)",
            borderRadius: "12px",
            padding: "16px",
            color: "var(--theme-text-sub, #64748B)",
            fontSize: "0.85rem",
          }}
        >
          Loading voices from your browser... (if this doesn't load, your browser may not support
          text-to-speech).
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                color: "var(--theme-text-sub, #475569)",
                fontSize: "0.78rem",
                fontWeight: 700,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{ ...selectStyle, width: "100%" }}
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.75rem", marginTop: "6px", lineHeight: "1.4" }}>
              Available voices (and whether they sound male/female) depend on your device — this list
              comes directly from your browser, not from Mentora.
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "var(--theme-text-sub, #475569)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Speed
              </label>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-text-main, #0F172A)" }}>
                {speed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--theme-accent, #F59E0B)",
                cursor: "pointer",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {!speaking ? (
              <button
                onClick={handlePlay}
                disabled={!text.trim()}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  background: "var(--theme-accent, #F59E0B)",
                  border: "none",
                  color: "var(--theme-accent-text, #0F172A)",
                  padding: "12px",
                  borderRadius: "10px",
                  cursor: text.trim() ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  opacity: text.trim() ? 1 : 0.6,
                  boxShadow: text.trim() ? "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                ▶ Play
              </button>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    background: "var(--theme-card-bg, #FFFFFF)",
                    border: "1px solid var(--theme-border, #CBD5E1)",
                    color: "var(--theme-text-main, #0F172A)",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button
                  onClick={handleStop}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}