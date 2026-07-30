import { NextRequest, NextResponse } from "next/server";

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  explanation: string;
}

// This route runs on the server only — the API key never reaches the browser.
export async function POST(req: NextRequest) {
  try {
    const { exam, subject, count, difficulty, emphasizeTopics } = await req.json();

    if (!exam || !subject || !count) {
      return NextResponse.json(
        { error: "Exam, subject, and count are all required." },
        { status: 400 }
      );
    }

    const allowedCounts = [5, 10, 15, 20, 25];
    const questionCount = allowedCounts.includes(Number(count))
      ? Number(count)
      : 10;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set in .env.local. Add it and restart the server.",
        },
        { status: 500 }
      );
    }

    const resolvedDifficulty = difficulty && difficulty !== "Mixed" ? difficulty : null;

    const systemPrompt = `You are an expert ${exam} exam question setter in India, creating a daily practice quiz for the subject "${subject}".

Generate exactly ${questionCount} multiple-choice questions covering a good variety of topics within "${subject}" for the ${exam} exam.

Return ONLY a JSON array (no markdown fences, no preamble) where each item has this exact shape:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "topic": "the specific sub-topic this question belongs to",
  "explanation": "a short 1-2 sentence explanation of why the correct answer is correct"
}

Rules:
- Exactly 4 options per question.
- correctIndex is 0-based, pointing to the correct option.
- Vary the topics across the ${subject} syllabus so weak areas can be identified.
${resolvedDifficulty ? `- Set every question's difficulty to "${resolvedDifficulty}" level (from the student's Learning Preferences), not just standard exam difficulty.` : "- Difficulty should match real exam standard, with a healthy mix of easy/medium/hard."}
${emphasizeTopics ? `- The student has previously struggled with these topics: ${emphasizeTopics}. Where relevant to "${subject}", weight extra questions toward these specific weak areas (this is their Adaptive Learning preference).` : ""}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate ${questionCount} practice questions for ${exam} - ${subject} now.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Failed to generate questions from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const finishReason = data.candidates?.[0]?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      return NextResponse.json(
        {
          error:
            "Too many questions requested at once. Please try a smaller count (like 10 or 15).",
        },
        { status: 502 }
      );
    }

    const rawText: string =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("") ?? "";

    let questions: PracticeQuestion[];

    try {
      let cleaned = rawText
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");

      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }

      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawText);
      return NextResponse.json(
        { error: "Could not understand the AI's response. Please try again." },
        { status: 502 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "AI returned no questions. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("generate-practice error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}