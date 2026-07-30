import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Test data is incomplete." },
        { status: 400 }
      );
    }

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

    const avgSecondsPerQuestion =
      time_used && total ? Math.round((time_used * 60) / total) : null;

    const systemPrompt = `You are an expert exam performance coach for Indian competitive exam students (${exam ?? "the exam"}).

Analyze the given mock test result and respond in this exact structure:
"# Test Analysis" as the title.
"## Weak Topics" — a "- " bullet list naming the specific subjects/topics with low accuracy from the subject breakdown, and briefly why they need work.
"## Time Management" — a short paragraph analyzing whether the pace (seconds per question, if given) was too slow, too fast, or fine, with one concrete tip.
"## Improvement Plan" — a "- " bullet list of 4-5 concrete, actionable steps the student should take before the next test, tied to the weak topics found.

Keep it specific to the actual numbers given, not generic advice.`;

    const userPrompt = `Test: ${title ?? "Mock Test"}
Exam: ${exam ?? "N/A"}
Score: ${score}/${total}
Correct: ${correct}, Wrong: ${wrong}, Skipped: ${skipped}
Overall Accuracy: ${accuracy}%
${avgSecondsPerQuestion ? `Average time per question: ~${avgSecondsPerQuestion} seconds` : ""}

Subject-wise breakdown:
${JSON.stringify(subject_breakdown, null, 2)}`;

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
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 3000,
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
        { error: "Failed to get analysis from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const finishReason = data.candidates?.[0]?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      return NextResponse.json(
        { error: "The analysis got too long to finish. Please try again." },
        { status: 502 }
      );
    }

    const analysis: string =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";

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