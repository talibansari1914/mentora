import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI, extractJSON } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";
import { getLanguageInstruction } from "@/lib/languageInstruction";

export const maxDuration = 60;

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  explanation: string;
}

// This route runs on the server only — no provider API key ever reaches the browser.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to use this feature." },
        { status: 401 }
      );
    }

    const usage = await checkAndIncrementUsage(supabase, user.id, "generate-practice");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const { exam, subject, count, difficulty, emphasizeTopics, language } = await req.json();

    if (!exam || !subject || !count) {
      return NextResponse.json(
        { error: "Exam, subject, and count are all required." },
        { status: 400 }
      );
    }

    const allowedCounts = [5, 10, 15, 20, 25];
    const questionCount = allowedCounts.includes(Number(count)) ? Number(count) : 10;

    const resolvedDifficulty = difficulty && difficulty !== "Mixed" ? difficulty : null;
    const languageInstruction = getLanguageInstruction(language);

    const systemPrompt = `You are an expert ${exam} exam question setter in India, creating a daily practice quiz for the subject "${subject}".

Language: ${languageInstruction} This applies to the question text, all four options, and the explanation — everything except the "topic" field, which should stay in English so it matches consistently across quizzes.

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

    const userText = `Generate ${questionCount} practice questions for ${exam} - ${subject} now.`;

    let rawText: string;
    try {
      const result = await callAI({
        task: "generate-practice",
        systemPrompt,
        userText,
        maxOutputTokens: 8192,
        jsonMode: true,
      });
      rawText = result.text;
    } catch {
      return NextResponse.json(
        { error: "Failed to generate questions from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    let questions: PracticeQuestion[];
    try {
      questions = extractJSON<PracticeQuestion[]>(rawText);
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