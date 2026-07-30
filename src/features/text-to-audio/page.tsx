"use client";

import React, { useState } from 'react';
import { TextEditor } from './components/TextEditor';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSettings } from './components/VoiceSettings';
import { TextToAudioConfigState, SupportedLanguage } from './types';
import { DEFAULT_CONFIG_STATE } from './constants/config';
import { Sparkles } from 'lucide-react';

export default function TextToAudioPage() {
  const [config, setConfig] = useState<TextToAudioConfigState>(
    DEFAULT_CONFIG_STATE || {
      text: '',
      language: 'English' as SupportedLanguage,
      speed: 1,
      voiceId: 'Male',
      style: 'Natural',
    }
  );

  const [showPlayer, setShowPlayer] = useState<boolean>(false);

  const handleConfigChange = (key: keyof TextToAudioConfigState, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGenerate = () => {
    if (!config.text || config.text.trim() === '') {
      alert('Please enter or paste some text first!');
      return;
    }
    setShowPlayer(true);
  };

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header Section */}
      <div>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px',
          }}
        >
          AI Text-to-Speech Studio
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
          Convert your text or uploaded documents into natural speech instantly.
        </p>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Editor + Audio Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Editor Component Box */}
          <div
            style={{
              background: '#1E293B',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <TextEditor config={config} onChange={handleConfigChange} />

            <button
              type="button"
              onClick={handleGenerate}
              style={{
                marginTop: '16px',
                width: '100%',
                background: '#3B82F6',
                color: '#FFFFFF',
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
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Sparkles size={18} /> Generate AI Audio
            </button>
          </div>

          {/* Audio Player Component Box */}
          {showPlayer && (
            <div
              style={{
                background: '#1E293B',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <AudioPlayer
                text={config.text || ''}
                language={config.language || 'English'}
                speed={config.speed || 1}
                voiceId={config.voiceId || 'Male'}
                style={config.style || 'Natural'}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Voice & Audio Settings Panel */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <VoiceSettings config={config} onChange={handleConfigChange} />
        </div>
      </div>
    </div>
  );
}