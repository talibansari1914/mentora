// features/text-to-audio/constants/config.ts
//
// Single source of truth for every selectable option in this feature.
// VoiceSettings.tsx renders its dropdowns/buttons FROM these arrays instead
// of hardcoding its own copies — add a language/voice/style here once and it
// shows up everywhere automatically, and there's no risk of the UI's values
// drifting out of sync with what AudioPlayer.tsx expects.

import {
  SupportedLanguage,
  VoiceStyle,
  SpeechSpeed,
  VoiceGender,
  LanguageOption,
  VoiceOption,
  VoiceStyleOption,
  TextToAudioConfigState
} from '../types';

export const MAX_TEXT_CHARACTER_LIMIT = 2000;

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'hinglish', label: 'Hinglish' },
];

// id === gender here on purpose — it's what both the <select>/button values
// AND AudioPlayer's voice-search logic key off of, so there's exactly one
// place ("male"/"female") that has to stay correct instead of two.
export const VOICE_OPTIONS: readonly VoiceOption[] = [
  { id: 'male' as VoiceGender, label: 'Male', gender: 'male' as VoiceGender },
  { id: 'female' as VoiceGender, label: 'Female', gender: 'female' as VoiceGender },
];

export const VOICE_STYLE_OPTIONS: readonly VoiceStyleOption[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'excited', label: 'Excited' },
];

export const SPEECH_SPEED_OPTIONS: readonly SpeechSpeed[] = [0.75, 1.0, 1.25, 1.5];

export const DEFAULT_CONFIG_STATE: Readonly<TextToAudioConfigState> = {
  text: '',
  language: 'en',
  voiceId: 'male',
  style: 'natural',
  speed: 1.0,
};