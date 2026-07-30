import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { sourceType, videoUrl, youtubeUrl, language = "Hindi" } = body;
    const targetUrl = youtubeUrl || videoUrl || "Provided Video";

    const prompt = `You are an expert educational AI teacher. Analyze the topic from this video source: "${targetUrl}" and generate detailed, professional study notes in ${language}.
    
    You MUST respond STRICTLY with a valid JSON object matching this exact structure (do NOT wrap in markdown \`\`\`json blocks if possible, just standard JSON):
    {
      "title": "Topic Title",
      "executiveSummary": "2-3 well-structured introductory sentences summarising the topic.",
      "sections": [
        {
          "heading": "Clear Section Name (without ### or symbols)",
          "content": ["First important subpoint explanation as a clear sentence.", "Second important subpoint explanation.", "Third important subpoint."]
        }
      ]
    }`;

    // Using the current active stable Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData, { status: 200 });
  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate notes from AI.",
      },
      { status: 500 }
    );
  }
}