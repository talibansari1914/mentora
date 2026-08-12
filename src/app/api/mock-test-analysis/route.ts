import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";

export const maxDuration = 60;

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

    const usage = await checkAndIncrementUsage(supabase, user.id, "mock-test-analysis");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const {
      title,
      exam,
      score,
      total,
      correct,
      wrong,
      skipped,
      accuracy,
      time_used,
      subject_breakdown,
    } = await req.json();

    if (!total || !subject_breakdown) {
      return NextResponse.json({ error: "Test data is incomplete." }, { status: 400 });
    }

    const avgSecondsPerQuestion =
      time_used && total ? Math.round((time_used * 60) / total) : null;

    const systemPrompt = `You are an expert exam performance coach for Indian competitive exam students (${exam ?? "the exam"}).

Analyze the given mock test result and respond in this exact structure:
"Test Analysis" as the title, on the first line, as plain text with no symbols around it.
"**Weak Topics**" alone on its own line, then a "- " bullet list naming the specific subjects/topics with low accuracy from the subject breakdown, and briefly why they need work.
"**Time Management**" alone on its own line, then a short paragraph analyzing whether the pace (seconds per question, if given) was too slow, too fast, or fine, with one concrete tip.
"**Improvement Plan**" alone on its own line, then a "- " bullet list of 4-5 concrete, actionable steps the student should take before the next test, tied to the weak topics found.

Formatting rules:
- Do NOT start the response with #, ##, *, or any markdown heading symbol.
- Keep generous blank-line spacing between the three sections above.
- Use double-asterisk bold **only** for the section titles above and for the subject/topic names and key numbers within the text — never bold an entire sentence.
- Use <u>...</u> underline for at most 1 single most critical takeaway, if any.
- Avoid unnecessary emojis.

Keep it specific to the actual numbers given, not generic advice.`;

    const userText = `Test: ${title ?? "Mock Test"}
Exam: ${exam ?? "N/A"}
Score: ${score}/${total}
Correct: ${correct}, Wrong: ${wrong}, Skipped: ${skipped}
Overall Accuracy: ${accuracy}%
${avgSecondsPerQuestion ? `Average time per question: ~${avgSecondsPerQuestion} seconds` : ""}

Subject-wise breakdown:
${JSON.stringify(subject_breakdown, null, 2)}`;

    let analysis: string;
    try {
      const result = await callAI({
        task: "mock-test-analysis",
        systemPrompt,
        userText,
        maxOutputTokens: 3000,
      });
      analysis = result.text;
    } catch {
      return NextResponse.json(
        { error: "Failed to get analysis from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "AI returned an empty analysis. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("mock-test-analysis error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}