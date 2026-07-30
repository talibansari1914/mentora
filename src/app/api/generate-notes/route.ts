import { NextRequest, NextResponse } from "next/server";

// This route runs on the server only — the API key never reaches the browser.
export async function POST(req: NextRequest) {
  try {
    const { exam, subject, topic } = await req.json();

    if (!exam || !subject || !topic) {
      return NextResponse.json(
        { error: "Exam, subject, and topic are all required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set in .env.local. Please add it before restarting the server.",
        },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert ${exam} exam tutor in India, writing beginner-friendly study notes for a student preparing for ${exam}.

Rules:
- Explain the topic completely from scratch, assuming zero prior knowledge.
- Break the explanation into clear numbered STEPS (Step 1, Step 2, Step 3...).
- Use simple, plain English with everyday analogies wherever helpful.
- After the step-by-step explanation, add a short "Quick Revision Points" bullet list.
- Keep formatting as: "# " for the main title, "## Step N: <name>" for each step heading, "- " for bullet points.
- Do not add any preamble like "Sure, here are your notes" — start directly with the title.`;

    const userPrompt = `Exam: ${exam}\nSubject: ${subject}\nTopic: ${topic}\n\nGenerate complete step-by-step notes on this topic.`;

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
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Failed to generate notes from AI. Please try again later." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const notes =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";

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