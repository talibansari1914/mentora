// features/text-to-audio/types/index.ts

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export type VoiceStyle = 'natural' | 'professional' | 'friendly' | 'excited';

export type SpeechSpeed = 0.75 | 1.0 | 1.25 | 1.5;

export type VoiceGender = 'male' | 'female';

export interface LanguageOption {
  id: SupportedLanguage;
  label: string;
}

export interface VoiceOption {
  id: string;
  label: string;
  gender: VoiceGender;
}

export interface VoiceStyleOption {
  id: VoiceStyle;
  label: string;
}

export interface TextToAudioConfigState {
  text: string;
  language: SupportedLanguage;
  voiceId: string;
  style: VoiceStyle;
  speed: SpeechSpeed;
}

export interface AudioGenerationResult {
  audioUrl: string;
  format: 'mp3' | 'wav' | 'ogg';
  durationSeconds?: number;
}

export interface ValidationErrors {
  text?: string;
  general?: string;
}