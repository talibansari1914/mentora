"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { LANGUAGE_OPTIONS, VOICE_OPTIONS } from '../constants/config';

export interface AudioPlayerProps {
  text: string;
  language: string;
  speed: number;
  voiceId?: string;
  style?: string;
}

// The Web Speech API has no real "emotional tone"/style parameter — the only
// levers it exposes are rate, pitch, and volume. This maps each style choice
// to a small pitch/rate nudge so picking a different style is at least
// audibly different, instead of being a complete no-op (which is what it was
// before). It's an approximation, not genuine style control.
const STYLE_PRESETS: Record<string, { pitch: number; rateMultiplier: number }> = {
  natural: { pitch: 1.0, rateMultiplier: 1.0 },
  professional: { pitch: 0.9, rateMultiplier: 0.95 },
  friendly: { pitch: 1.1, rateMultiplier: 1.05 },
  excited: { pitch: 1.25, rateMultiplier: 1.15 },
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, language, speed, voiceId, style }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore any cancellation exceptions
    }

    setIsPlaying(false);
    setProgress(0);
    setVoiceNote(null);

    const u = new SpeechSynthesisUtterance(text || '');

    // Speed + style. Style has no dedicated Web Speech API field, so it's
    // approximated by nudging pitch and blending into the rate — see
    // STYLE_PRESETS above.
    const validSpeed = typeof speed === 'number' && Number.isFinite(speed) ? speed : 1;
    const preset = STYLE_PRESETS[style || 'natural'] || STYLE_PRESETS.natural;
    u.rate = Math.min(2, Math.max(0.5, validSpeed * preset.rateMultiplier));
    u.pitch = preset.pitch;

    // Language code mapping — keyed by the same stable ids VoiceSettings.tsx
    // sends ('en' | 'hi' | 'hinglish'), not display labels. Labels can change
    // (translation, rewording) without silently breaking this lookup.
    // "Hinglish" has no dedicated browser/OS voice locale, so hi-IN is the
    // closest practical approximation for mixed Hindi-English text.
    const langMap: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      hinglish: 'hi-IN',
    };
    u.lang = langMap[language] || 'en-US';

    // Map male/female voice selection from browser voices
    const updateVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = u.lang.split('-')[0];
        const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));

        if (langVoices.length === 0) {
          // No voice at all for this language on this browser/OS — the
          // system default voice will speak instead, so gender selection
          // (and possibly the language itself) won't have any audible
          // effect. Nothing in this code can fix that — it depends on
          // voices actually being installed on the user's device/browser.
          setVoiceNote(
            `This browser has no installed voice for "${u.lang}" — it will fall back to its default voice regardless of the Male/Female choice.`
          );
        }

        let selectedVoice = langVoices.find(v => {
          const name = v.name.toLowerCase();
          if (voiceId === 'female') {
            return name.includes('female') || name.includes('zira') || name.includes('sara') || name.includes('victoria') || name.includes('monica');
          } else {
            return name.includes('male') || name.includes('david') || name.includes('george') || name.includes('pablo') || name.includes('daniel');
          }
        });

        if (!selectedVoice && langVoices.length > 0) {
          selectedVoice = langVoices[0];
          setVoiceNote(
            `This browser only exposes ${langVoices.length} voice(s) for "${u.lang}" with no clear Male/Female name match — using "${selectedVoice.name}" for both.`
          );
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
    u.onerror = (event: SpeechSynthesisErrorEvent) => {
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

  // Resolve the stable ids back to human-readable labels just for display —
  // the logic above never uses these, only the raw ids.
  const languageLabel = LANGUAGE_OPTIONS.find((l) => l.id === language)?.label ?? language;
  const voiceLabel = VOICE_OPTIONS.find((v) => v.id === voiceId)?.label ?? (voiceId || 'Male');

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--theme-accent, #f59e0b)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Generated Audio Preview ({languageLabel} - {voiceLabel}, {speed}x)
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--theme-text-sub, #94a3b8)", background: "var(--theme-hover-bg, rgba(255,255,255,0.04))", padding: "2px 8px", borderRadius: "4px" }}>
          Live Speech Engine
        </span>
      </div>

      {voiceNote && (
        <p style={{ fontSize: "0.75rem", color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "8px 12px", margin: 0, lineHeight: 1.5 }}>
          ⚠️ {voiceNote}
        </p>
      )}

      <div style={{ width: "100%", height: "6px", background: "var(--theme-border, rgba(255,255,255,0.08))", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--theme-accent, #f59e0b)",
            transition: "width 0.1s linear"
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--theme-bg-main, #080c14)",
          border: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
          padding: "12px 16px",
          borderRadius: "10px",
          flexWrap: "wrap",
          gap: "12px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              background: "var(--theme-accent, #f59e0b)",
              border: "none",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--theme-accent-text, #070b14)",
              cursor: "pointer",
              boxShadow: "0 2px 8px var(--theme-accent-glow, rgba(245,158,11,0.3))",
              transition: "transform 0.1s",
              flexShrink: 0,
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
              color: "var(--theme-text-sub, #94a3b8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Restart Audio"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--theme-text-sub, #94a3b8)", fontSize: "0.85rem" }}>
          <Volume2 size={16} style={{ color: "var(--theme-accent, #f59e0b)" }} />
          <span>{isPlaying ? "Speaking..." : "Ready to Play"}</span>
        </div>
      </div>
    </div>
  );
};