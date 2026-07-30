// features/text-to-audio/components/SettingsPanel.tsx

import React from 'react';
import { 
  LANGUAGE_OPTIONS, 
  VOICE_OPTIONS, 
  VOICE_STYLE_OPTIONS, 
  SPEECH_SPEED_OPTIONS 
} from '../constants/config';
import { TextToAudioConfigState, SupportedLanguage, VoiceStyle, SpeechSpeed } from '../types';
import { Sliders, Globe, Mic, Smile, Activity } from 'lucide-react';

export interface SettingsPanelProps {
  config: TextToAudioConfigState;
  onChange: (key: keyof TextToAudioConfigState, value: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
        <Sliders size={18} style={{ color: "#3B82F6" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Voice & Audio Settings</h3>
      </div>

      {/* Language Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
          <Globe size={14} /> LANGUAGE
        </label>
        <select
          value={config.language}
          onChange={(e) => onChange('language', e.target.value as SupportedLanguage)}
          style={{
            background: "#0B132B",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#F8FAFC",
            fontSize: "0.88rem",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Style Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
          <Smile size={14} /> VOICE STYLE
        </label>
        <select
          value={config.style}
          onChange={(e) => onChange('style', e.target.value as VoiceStyle)}
          style={{
            background: "#0B132B",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#F8FAFC",
            fontSize: "0.88rem",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {VOICE_STYLE_OPTIONS.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Gender / Type Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
          <Mic size={14} /> VOICE
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {VOICE_OPTIONS.map((voice) => {
            const isSelected = config.voiceId === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onChange('voiceId', voice.id)}
                style={{
                  background: isSelected ? "rgba(59, 130, 246, 0.15)" : "#0B132B",
                  border: isSelected ? "1px solid #3B82F6" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "10px",
                  color: isSelected ? "#60A5FA" : "#94A3B8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                {voice.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Speech Speed Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={14} /> SPEECH SPEED
          </label>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#60A5FA" }}>{config.speed}x</span>
        </div>
        
        <input
          type="range"
          min="0.75"
          max="1.5"
          step="0.25"
          value={config.speed}
          onChange={(e) => onChange('speed', parseFloat(e.target.value) as SpeechSpeed)}
          style={{
            accentColor: "#3B82F6",
            cursor: "pointer",
            width: "100%",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748B" }}>
          {SPEECH_SPEED_OPTIONS.map((spd) => (
            <span key={spd}>{spd}x</span>
          ))}
        </div>
      </div>
    </div>
  );
};