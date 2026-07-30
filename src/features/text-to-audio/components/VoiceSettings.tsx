"use client";

import React from 'react';
import { Sliders, Globe, Smile, Mic, Activity } from 'lucide-react';
import { TextToAudioConfigState } from '../types';

export interface VoiceSettingsProps {
  config: TextToAudioConfigState;
  onChange: (key: keyof TextToAudioConfigState, value: any) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ config, onChange }) => {
  const currentLang = config.language || 'English';
  const currentStyle = config.style || 'Natural';
  const currentVoice = config.voiceId || 'Male';
  const currentSpeed = config.speed || 1;

  return (
    <div
      style={{
        background: '#1E293B',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        width: '100%',
        color: '#F8FAFC',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sliders size={20} style={{ color: '#3B82F6' }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
          Voice & Audio Settings
        </span>
      </div>

      {/* 1. Language Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.05em',
          }}
        >
          <Globe size={14} /> LANGUAGE
        </label>
        <select
          value={currentLang}
          onChange={(e) => onChange('language', e.target.value as any)}
          style={{
            background: '#0B132B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
        </select>
      </div>

      {/* 2. Voice Style Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.05em',
          }}
        >
          <Smile size={14} /> VOICE STYLE
        </label>
        <select
          value={currentStyle}
          onChange={(e) => onChange('style', e.target.value)}
          style={{
            background: '#0B132B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="Natural">Natural</option>
          <option value="Professional">Professional</option>
          <option value="Conversational">Conversational</option>
          <option value="News">News</option>
        </select>
      </div>

      {/* 3. Voice Gender Toggle (Male / Female) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.05em',
          }}
        >
          <Mic size={14} /> VOICE
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Male', 'Female'].map((gender) => {
            const isSelected = currentVoice === gender;
            return (
              <button
                key={gender}
                type="button"
                onClick={() => onChange('voiceId', gender)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#0B132B',
                  border: isSelected
                    ? '1px solid #3B82F6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#3B82F6' : '#94A3B8',
                }}
              >
                {gender}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Speech Speed Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.05em',
            }}
          >
            <Activity size={14} /> SPEECH SPEED
          </label>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#3B82F6',
            }}
          >
            {currentSpeed}x
          </span>
        </div>

        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.25"
          value={currentSpeed}
          onChange={(e) => onChange('speed', parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#3B82F6',
            cursor: 'pointer',
          }}
        />

        {/* Speed Labels below slider */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64748B',
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