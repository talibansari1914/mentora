// ============================================================================
// src/app/api/ai-tutor/route.ts  (UPDATED - reference example)
//
// Shows exactly how aiProvider.ts + usageLimit.ts plug into an existing
// route. The same 2 changes apply to the other 7 routes (generate-notes,
// code-mentor, writing-assistant, generate-practice, mock-test-analysis,
// book-tools, video-notes):
//   1. Call checkAndIncrementUsage() right after the auth check.
//   2. Replace the raw fetch(...) to Gemini with callAI({ task, ... }).
// Everything else (prompt building, request validation, response shape)
// stays exactly as it was.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";

export const maxDuration = 60;

interface TutorFile {
  mimeType: string;
  data: string;
}

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

    // --- NEW: usage limit check, right after auth, before any AI call ---
    const usage = await checkAndIncrementUsage(supabase, user.id, "ai-tutor");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }
    // ----------------------------------------------------------------------

    const {
      question,
      level,
      language,
      file,
      personality,
      explanationStyle,
    }: {
      question?: string;
      level?: "beginner" | "advanced";
      language?: "english" | "hindi" | "hinglish";
      file?: TutorFile;
      personality?: string;
      explanationStyle?: string;
    } = await req.json();

    if (!question?.trim() && !file) {
      return NextResponse.json(
        { error: "Please type a question or upload an image/PDF." },
        { status: 400 }
      );
    }

    const resolvedLevel = level === "advanced" ? "advanced" : "beginner";
    const resolvedLanguage =
      language === "hindi"
        ? "Hindi"
        : language === "hinglish"
        ? "Hinglish (a natural mix of Hindi and English)"
        : "English";
    const resolvedPersonality = personality || "Friendly";
    const resolvedStyle = explanationStyle || "Detailed";

    const systemPrompt = `You are an expert personal AI tutor for Indian competitive exam students (JEE, NEET, UPSC, SSC, NDA, CUET).

Your personality: ${resolvedPersonality}. Let this personality come through in your tone.
Your explanation style: ${resolvedStyle}.

A student has a doubt. They may give it as plain text, an image, or a PDF page.

Your job:
- If a file is given, first read/understand its content, then solve the doubt inside it.
- Explain the answer completely from scratch, assuming a ${resolvedLevel} level of prior knowledge.
- Break the explanation into clear numbered steps as section headings.
- If it's a mathematical problem, show the actual calculation at each step.
- Write the entire response in ${resolvedLanguage}.
- Do NOT start the response with #, ##, *, or any markdown heading symbol — start directly with the title as plain text on the first line.
- Put every section title (e.g. "Step 1: ...") alone on its own line wrapped in double asterisks, like **Step 1: Understanding the problem** — nothing else on that line.
- Keep generous blank-line spacing between sections.
- Use double-asterisk bold **only** for: section titles, key terms, formula names, and important numbers. Never bold an entire paragraph or sentence.
- Use single-asterisk italics *only* for scientific names, foreign-language terms, or rare emphasis.
- Use <u>...</u> underline very sparingly — at most 1-2 of the single most critical points in the whole response.
- If a step has 2-3 supporting details, add them as indented sub-bullets ("- " with two leading spaces) — sub-points should be plain text, not bolded.
- Avoid unnecessary emojis — at most one per section, only if it genuinely improves readability.
- Do not add filler like "Sure, here's the explanation" - start directly with the title.`;

    // --- CHANGED: raw fetch(...) replaced with callAI() ---
    let answer: string;
    try {
      const result = await callAI({
        task: "ai-tutor",
        systemPrompt,
        userText: question?.trim()
          ? `Doubt: ${question}`
          : "Read the attached file and explain/solve the doubt in it.",
        file: file ? { mimeType: file.mimeType, data: file.data } : undefined,
        maxOutputTokens: 4096,
      });
      answer = result.text;
    } catch (err) {
      // Every provider in the chain failed. This generic message is what
      // the user sees - no mention of rate limits or providers.
      return NextResponse.json(
        { error: "Failed to get an answer from AI. Please try again in a moment." },
        { status: 502 }
      );
    }
    // --------------------------------------------------------

    if (!answer) {
      return NextResponse.json(
        { error: "AI returned an empty answer. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("ai-tutor error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}