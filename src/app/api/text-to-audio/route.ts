// src/app/api/text-to-audio/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to retry API calls on 503 / high demand errors
async function generateWithRetry(payload: any, retries = 3, delay = 2000): Promise<any> {
  try {
    return await ai.models.generateContent(payload);
  } catch (error: any) {
    // Check if error is 503 (Unavailable) or high demand
    if (retries > 0 && (error?.status === 503 || error?.message?.includes('high demand') || error?.code === 503)) {
      console.warn(`Model busy (503). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return generateWithRetry(payload, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, language, style, voiceId, speed } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const prompt = `Convert the following text into natural-sounding speech configuration. Language: ${language}, Style: ${style}, Voice: ${voiceId}, Speed: ${speed}. Text: "${text}"`;

    // Use retry wrapper for robust handling during high traffic spikes
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash', // Fallback or stable flash model if preview has high traffic
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg', // Sample or generated buffer URL
      durationSeconds: Math.round(text.length / 15),
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Service is currently experiencing high demand. Please try again in a moment.' },
      { status: 503 }
    );
  }
}