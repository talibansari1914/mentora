// features/text-to-audio/constants/config.ts

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

export const VOICE_OPTIONS: readonly VoiceOption[] = [
  { id: 'voice-male-std-1', label: 'Male', gender: 'male' as VoiceGender },
  { id: 'voice-female-std-1', label: 'Female', gender: 'female' as VoiceGender },
];

export const VOICE_STYLE_OPTIONS: readonly VoiceStyleOption[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
];

export const SPEECH_SPEED_OPTIONS: readonly SpeechSpeed[] = [0.75, 1.0, 1.25, 1.5];

export const DEFAULT_CONFIG_STATE: Readonly<TextToAudioConfigState> = {
  text: '',
  language: 'en',
  voiceId: 'voice-male-std-1',
  style: 'natural',
  speed: 1.0,
};