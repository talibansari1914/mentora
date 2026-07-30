"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

export interface AudioPlayerProps {
  text: string;
  language: string;
  speed: number;
  voiceId?: string;
  style?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, language, speed, voiceId, style }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore any cancellation exceptions
    }

    setIsPlaying(false);
    setProgress(0);

    const u = new SpeechSynthesisUtterance(text || '');
    
    // Set Speed
    const validSpeed = typeof speed === 'number' && Number.isFinite(speed) ? speed : 1;
    u.rate = validSpeed;

    // Set Language Code mapping
    const langMap: Record<string, string> = {
      English: 'en-US',
      Hindi: 'hi-IN',
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
    };
    u.lang = langMap[language] || 'en-US';

    // Map Male/Female voice selection from browser voices
    const updateVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = u.lang.split('-')[0];
        const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        
        let selectedVoice = langVoices.find(v => {
          const name = v.name.toLowerCase();
          if (voiceId === 'Female') {
            return name.includes('female') || name.includes('zira') || name.includes('sara') || name.includes('victoria') || name.includes('monica');
          } else {
            return name.includes('male') || name.includes('david') || name.includes('george') || name.includes('pablo') || name.includes('daniel');
          }
        });

        if (!selectedVoice && langVoices.length > 0) {
          selectedVoice = langVoices[0];
        }

        if (selectedVoice) {
          u.voice = selectedVoice;
        }
      }
    };

    updateVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoice;
    }

    u.onboundary = (event) => {
      if (text && text.length > 0) {
        const currentProgress = Math.min(100, Math.round((event.charIndex / text.length) * 100));
        setProgress(currentProgress);
      }
    };

    u.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    // Suppress canceled/interrupted error events completely
    u.onerror = (event: any) => {
      const errType = event?.error;
      if (errType !== 'interrupted' && errType !== 'canceled' && errType !== 'not-allowed') {
        console.error("SpeechSynthesis error:", event);
      }
      setIsPlaying(false);
    };

    setUtterance(u);

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Cleanup safety
      }
    };
  }, [text, speed, language, voiceId, style]);

  const togglePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (!text || text.trim() === "") {
      alert("Please enter or paste some text first!");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else if (utterance) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const handleRestart = () => {
    if (!utterance || !text || text.trim() === "") return;
    window.speechSynthesis.cancel();
    setProgress(0);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Generated Audio Preview ({language} - {voiceId || 'Male'}, {speed}x)
        </span>
        <span style={{ fontSize: "0.75rem", color: "#64748B", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
          Live Speech Engine
        </span>
      </div>

      <div style={{ width: "100%", height: "6px", background: "#1E293B", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#3B82F6",
            transition: "width 0.1s linear"
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B132B", padding: "12px 16px", borderRadius: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              background: "#3B82F6",
              border: "none",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)",
              transition: "transform 0.1s"
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: "2px" }} />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Restart Audio"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94A3B8", fontSize: "0.85rem" }}>
          <Volume2 size={16} style={{ color: "#3B82F6" }} />
          <span>{isPlaying ? "Speaking..." : "Ready to Play"}</span>
        </div>
      </div>
    </div>
  );
};