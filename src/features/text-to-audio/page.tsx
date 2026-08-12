"use client";

import React, { useState } from 'react';
import { TextEditor } from './components/TextEditor';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSettings } from './components/VoiceSettings';
import { TextToAudioConfigState } from './types';
import { DEFAULT_CONFIG_STATE } from './constants/config';
import { validateTextInput } from './utils/validation';
import { Sparkles } from 'lucide-react';
import BackToDashboardLink from '@/components/common/BackToDashboardLink';

export default function TextToAudioPage() {
  // DEFAULT_CONFIG_STATE is always a real exported object, so the old
  // `DEFAULT_CONFIG_STATE || {...fallback}` here never actually used the
  // fallback — and that fallback used different values ('English'/'Male')
  // than DEFAULT_CONFIG_STATE ('en'/'male') anyway, which was itself a bug.
  const [config, setConfig] = useState<TextToAudioConfigState>(DEFAULT_CONFIG_STATE);

  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfigChange = <K extends keyof TextToAudioConfigState>(key: K, value: TextToAudioConfigState[K]) => {
    if (key === 'text' && error) setError(null);
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGenerate = () => {
    const errors = validateTextInput(config.text);
    if (errors.text) {
      setError(errors.text);
      return;
    }
    setError(null);
    setShowPlayer(true);
  };

  return (
    <div
      style={{
        padding: 'clamp(16px, 4vw, 32px)',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
        background: 'var(--theme-bg-main, #080c14)',
        minHeight: '100vh',
      }}
    >
      {/* Header Section */}
      <div>
        <BackToDashboardLink />
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--theme-text-main, #f8fafc)',
            marginBottom: '8px',
          }}
        >
          AI Text-to-Speech Studio
        </h1>
        <p style={{ color: 'var(--theme-text-sub, #94a3b8)', fontSize: '0.95rem' }}>
          Convert your text or uploaded documents into natural speech instantly.
        </p>
      </div>

      {/* Main 2-Column Layout. Uses a CSS class (defined below) instead of an
          inline fixed grid so it can collapse to a single column on phones —
          the previous inline '1fr 360px' had no breakpoint and would overflow
          on small screens. */}
      <div className="tts-layout-grid">
        {/* LEFT COLUMN: Editor + Audio Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Editor Component Box */}
          <div
            style={{
              background: 'var(--theme-card-bg, #0f172a)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--theme-border, rgba(255,255,255,0.08))',
            }}
          >
            <TextEditor config={config} onChange={handleConfigChange} />

            {error && (
              <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '10px', fontWeight: 600 }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              className="tts-generate-btn"
              style={{
                marginTop: '16px',
                width: '100%',
                background: 'var(--theme-accent, #f59e0b)',
                color: 'var(--theme-accent-text, #070b14)',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px var(--theme-accent-glow, rgba(245,158,11,0.3))',
                transition: 'transform 0.12s ease, filter 0.12s ease',
              }}
            >
              <Sparkles size={18} /> Generate AI Audio
            </button>
          </div>

          {/* Audio Player Component Box */}
          {showPlayer && (
            <div
              style={{
                background: 'var(--theme-card-bg, #0f172a)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--theme-border, rgba(255,255,255,0.08))',
              }}
            >
              <AudioPlayer
                text={config.text || ''}
                language={config.language || 'en'}
                speed={config.speed || 1}
                voiceId={config.voiceId || 'male'}
                style={config.style || 'natural'}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Voice & Audio Settings Panel */}
        <div className="tts-settings-column" style={{ position: 'sticky', top: '24px' }}>
          <VoiceSettings config={config} onChange={handleConfigChange} />
        </div>
      </div>

      {/* Responsive breakpoint: collapse to a single column and drop the
          sticky positioning on tablets/phones so the settings panel doesn't
          squeeze the editor into an unusably narrow strip. */}
      <style jsx global>{`
        .tts-layout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .tts-layout-grid {
            grid-template-columns: 1fr;
          }
          .tts-settings-column {
            position: static !important;
          }
        }
        .tts-generate-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .tts-generate-btn:active {
          filter: brightness(0.95);
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}