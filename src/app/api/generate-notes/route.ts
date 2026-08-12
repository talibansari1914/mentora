import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";
import { getLanguageInstruction } from "@/lib/languageInstruction";

// Generation calls can take longer than the platform's default serverless
// timeout, especially for longer inputs. 60s is the max allowed on
// Vercel's Hobby tier.
export const maxDuration = 60;

// This route runs on the server only — no provider API key ever reaches the browser.
export async function POST(req: NextRequest) {
  try {
    // Defense-in-depth: middleware.ts already blocks unauthenticated requests
    // to this route. We check again here in case this route is ever called
    // in a way that bypasses the middleware (e.g. a future config change),
    // so provider API keys can never be used by a logged-out request.
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

    const usage = await checkAndIncrementUsage(supabase, user.id, "generate-notes");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const { exam, subject, topic, language } = await req.json();

    if (!exam || !subject || !topic) {
      return NextResponse.json(
        { error: "Exam, subject, and topic are all required." },
        { status: 400 }
      );
    }

    const languageInstruction = getLanguageInstruction(language);

    const systemPrompt = `You are an expert ${exam} exam tutor in India, writing beginner-friendly study notes for a student preparing for ${exam}.

Language: ${languageInstruction}

Rules:
- Explain the topic completely from scratch, assuming zero prior knowledge, using simple language and everyday analogies wherever helpful.
- Break the explanation into clear numbered steps as section headings (e.g. **Step 1: What are Assets for a Bank?**, **Step 2: ...**).
- After the step-by-step explanation, add a **Quick Revision Points** section with a bullet list.
- Do NOT start the response with #, ##, *, or any markdown heading symbol.
- Start directly with the topic title as plain text on the first line (no symbols around it) — e.g. "Non-Performing Assets (NPA)" not "# Non-Performing Assets (NPA)".
- Put every section title alone on its own line wrapped in double asterisks, like **Step 1: What are Assets for a Bank?** — nothing else on that line.
- Keep generous blank-line spacing between sections.
- Use double-asterisk bold **only** for: section titles, important keywords, key concepts, formulas, and key-term definitions. Never bold an entire paragraph or sentence.
- Use single-asterisk italics *only* for scientific names, foreign/Sanskrit/Hindi terms written in English, or rare emphasis.
- Use <u>...</u> underline very sparingly — at most 1-2 of the single most exam-critical points in the whole response.
- Use "- " for bullet points; sub-points should be plain text, not bolded, indented with two leading spaces before "- ".
- Avoid unnecessary emojis — use at most one per section, only if it genuinely improves readability.`;

    const userText = `Exam: ${exam}\nSubject: ${subject}\nTopic: ${topic}\n\nGenerate complete step-by-step notes on this topic.`;

    let notes: string;
    try {
      const result = await callAI({ task: "generate-notes", systemPrompt, userText });
      notes = result.text;
    } catch {
      return NextResponse.json(
        { error: "Failed to generate notes from AI. Please try again later." },
        { status: 502 }
      );
    }

    if (!notes) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ notes });
  } catch (err) {
    console.error("generate-notes error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}