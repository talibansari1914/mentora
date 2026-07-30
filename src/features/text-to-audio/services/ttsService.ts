// features/text-to-audio/services/ttsService.ts

import { TextToAudioConfigState, AudioGenerationResult } from '../types';

export class TTSGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TTSGenerationError';
  }
}

export const generateAudio = async (
  config: TextToAudioConfigState
): Promise<AudioGenerationResult> => {
  try {
    const response = await fetch('/api/text-to-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new TTSGenerationError(
        data.error || 'Failed to generate speech audio.'
      );
    }

    return {
      audioUrl: data.audioUrl,
      format: data.format || 'wav',
      durationSeconds: data.durationSeconds || 0,
    };
  } catch (error: any) {
    if (error instanceof TTSGenerationError) {
      throw error;
    }
    throw new TTSGenerationError(
      error.message || 'Network error while contacting speech server.'
    );
  }
};