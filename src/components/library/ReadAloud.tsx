"use client";

import { useEffect, useState } from "react";
import { G } from "@/constants/colors";

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
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "white",
    fontSize: ".85rem",
    outline: "none",
  };

  return (
    <div>
      {voices.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem" }}>
          Loading voices from your browser... (if this doesn't load, your browser may not support
          text-to-speech).
        </p>
      ) : (
        <>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              Voice
            </label>
            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p style={{ color: "#475569", fontSize: ".72rem", marginTop: "6px" }}>
              Available voices (and whether they sound male/female) depend on your device — this list
              comes directly from your browser, not from Mentora.
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              Speed: {speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {!speaking ? (
              <button
                onClick={handlePlay}
                disabled={!text.trim()}
                style={{
                  flex: 1,
                  background: G.grad,
                  border: "none",
                  color: "#111827",
                  padding: "12px",
                  borderRadius: "10px",
                  cursor: text.trim() ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  opacity: text.trim() ? 1 : 0.6,
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
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,.1)",
                    color: "white",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button
                  onClick={handleStop}
                  style={{
                    flex: 1,
                    background: "rgba(239,68,68,.1)",
                    border: "1px solid rgba(239,68,68,.3)",
                    color: "#EF4444",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 700,
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