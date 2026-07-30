import { NextRequest, NextResponse } from "next/server";

interface TutorFile {
  mimeType: string;
  data: string; // base64, no data-url prefix
}

export async function POST(req: NextRequest) {
  try {
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

    const resolvedLevel = level === "advanced" ? "advanced" : "beginner";
    const resolvedLanguage =
      language === "hindi" ? "Hindi" : language === "hinglish" ? "Hinglish (a natural mix of Hindi and English)" : "English";
    const resolvedPersonality = personality || "Friendly";
    const resolvedStyle = explanationStyle || "Detailed";

    const systemPrompt = `You are an expert personal AI tutor for Indian competitive exam students (JEE, NEET, UPSC, SSC, NDA, CUET).

Your personality: ${resolvedPersonality}. Let this personality come through in your tone — for example, a "Strict Teacher" is firm and no-nonsense, a "Motivational" tutor encourages the student, an "Exam Coach" is tactical and focused on scoring well, a "Professional" tutor is neutral and precise, and "Friendly" is warm and approachable.

Your explanation style: ${resolvedStyle}. "Short" means concise, to the point. "Detailed" means thorough. "Bullet Points" means prefer lists over paragraphs. "Examples" means anchor every concept in a concrete example. "Story Based" means use a narrative or analogy to explain.

A student has a doubt. They may give it as plain text, an image (which could be a printed question, a handwritten note, or a diagram), or a PDF page.

Your job:
- If a file is given, first read/understand its content (including handwritten text and mathematical equations if present), then solve the doubt inside it. If there is also a text question, treat the text as extra context or the actual question.
- Explain the answer completely from scratch, assuming a ${resolvedLevel} level of prior knowledge.
- Break the explanation into clear numbered STEPS (Step 1, Step 2, Step 3...).
- If it's a mathematical problem, show the actual calculation at each step, not just the final answer.
- Write the entire response in ${resolvedLanguage}.
- Formatting: use "# " for the main title (a short restatement of the doubt), "## Step N: <name>" for each step heading, and "- " for bullet points (e.g. a final "Key Takeaways" section).
- Do not add filler like "Sure, here's the explanation" — start directly with the title.`;

    const parts: any[] = [];

    if (file) {
      parts.push({
        inline_data: {
          mime_type: file.mimeType,
          data: file.data,
        },
      });
    }

    parts.push({
      text: question?.trim()
        ? `Doubt: ${question}`
        : "Read the attached file and explain/solve the doubt in it.",
    });

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
          contents: [{ role: "user", parts }],
          generationConfig: {
            maxOutputTokens: 4096,
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
        { error: "Failed to get an answer from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const finishReason = data.candidates?.[0]?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      return NextResponse.json(
        {
          error:
            "The answer got too long to finish. Please try asking a more specific doubt.",
        },
        { status: 502 }
      );
    }

    const answer: string =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";

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