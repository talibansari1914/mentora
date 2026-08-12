"use client";

import React from 'react';
import { Sliders, Globe, Smile, Mic, Activity } from 'lucide-react';
import { TextToAudioConfigState, SupportedLanguage, VoiceStyle, VoiceGender, SpeechSpeed } from '../types';
import { LANGUAGE_OPTIONS, VOICE_OPTIONS, VOICE_STYLE_OPTIONS } from '../constants/config';

export interface VoiceSettingsProps {
  config: TextToAudioConfigState;
  onChange: <K extends keyof TextToAudioConfigState>(key: K, value: TextToAudioConfigState[K]) => void;
}

// NOTE ON FALLBACKS: every var(--theme-*) below has a second argument, e.g.
// var(--theme-card-bg, #0f172a). That fallback only kicks in if the
// --theme-* custom properties aren't defined at all in the page — which
// happens if this component is rendered somewhere that doesn't load the
// project's src/styles/globals.css (an isolated preview/sandbox, for
// example). Inside the real app, where globals.css IS loaded, the fallback
// is never used and the normal light/dark theme still applies exactly as
// before. This is purely a safety net, not a change in behavior.
export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ config, onChange }) => {
  const currentSpeed = config.speed || 1;

  const selectStyle: React.CSSProperties = {
    background: 'var(--theme-bg-main, #080c14)',
    border: '1px solid var(--theme-border, rgba(255,255,255,0.08))',
    borderRadius: '10px',
    padding: '10px 14px',
    color: 'var(--theme-text-main, #f8fafc)',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--theme-text-sub, #94a3b8)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '0.05em',
  };

  return (
    <div
      style={{
        background: 'var(--theme-card-bg, #0f172a)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--theme-border, rgba(255,255,255,0.08))',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        width: '100%',
        color: 'var(--theme-text-main, #f8fafc)',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sliders size={20} style={{ color: 'var(--theme-accent, #f59e0b)' }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--theme-text-main, #f8fafc)' }}>
          Voice & Audio Settings
        </span>
      </div>

      {/* 1. Language Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={labelStyle}>
          <Globe size={14} /> LANGUAGE
        </label>
        <select
          value={config.language}
          onChange={(e) => onChange('language', e.target.value as SupportedLanguage)}
          style={selectStyle}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Voice Style Dropdown — the browser's built-in speech engine has
          no real "emotional tone" API, so this can't change HOW natural the
          voice sounds. What it DOES do (see AudioPlayer.tsx) is nudge pitch
          and pacing a little per style, so picking a different one is at
          least audibly different rather than a complete no-op. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={labelStyle}>
          <Smile size={14} /> VOICE STYLE
        </label>
        <select
          value={config.style}
          onChange={(e) => onChange('style', e.target.value as VoiceStyle)}
          style={selectStyle}
        >
          {VOICE_STYLE_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Voice Gender Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={labelStyle}>
          <Mic size={14} /> VOICE
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {VOICE_OPTIONS.map((voice) => {
            const isSelected = config.voiceId === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onChange('voiceId', voice.id as VoiceGender)}
                style={{
                  flex: '1 1 100px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isSelected
                    ? 'var(--theme-accent-soft, rgba(245,158,11,0.12))'
                    : 'var(--theme-bg-main, #080c14)',
                  border: isSelected
                    ? '1px solid var(--theme-accent, #f59e0b)'
                    : '1px solid var(--theme-border, rgba(255,255,255,0.08))',
                  color: isSelected ? 'var(--theme-accent, #f59e0b)' : 'var(--theme-text-sub, #94a3b8)',
                }}
              >
                {voice.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Speech Speed Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <label style={labelStyle}>
            <Activity size={14} /> SPEECH SPEED
          </label>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--theme-accent, #f59e0b)' }}>
            {currentSpeed}x
          </span>
        </div>

        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.25"
          value={currentSpeed}
          onChange={(e) => onChange('speed', parseFloat(e.target.value) as SpeechSpeed)}
          style={{
            width: '100%',
            accentColor: 'var(--theme-accent, #f59e0b)',
            cursor: 'pointer',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--theme-muted-text, #64748b)',
          }}
        >
          <span>0.75x</span>
          <span>1x</span>
          <span>1.25x</span>
          <span>1.5x</span>
        </div>
      </div>
    </div>
  );
};