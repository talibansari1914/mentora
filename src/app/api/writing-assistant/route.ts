import { NextRequest, NextResponse } from "next/server";

type Mode = "essay" | "grammar" | "rewrite" | "paraphrase";

export async function POST(req: NextRequest) {
  try {
    const {
      mode,
      text,
      wordCount,
      tone,
      responseLanguage,
    }: {
      mode: Mode;
      text?: string;
      wordCount?: number;
      tone?: string;
      responseLanguage?: string;
    } = await req.json();

    if (!mode || !text?.trim()) {
      return NextResponse.json(
        { error: mode === "essay" ? "Please enter an essay topic." : "Please paste some text." },
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

    const resolvedLanguage =
      responseLanguage === "hindi"
        ? "Hindi"
        : responseLanguage === "hinglish"
        ? "Hinglish (a natural mix of Hindi and English)"
        : "English";
    const languageInstruction = ` Write the entire output in ${resolvedLanguage}.`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "essay":
        systemPrompt = `You are an expert essay-writing coach for Indian competitive exam students (UPSC Mains, etc.). Write a well-structured essay of approximately ${wordCount ?? 250} words in a ${tone ?? "Formal"} tone. Structure it with a clear introduction, body paragraphs with distinct points, and a conclusion. Use "# " for the essay title only, then plain paragraphs — no other markdown formatting inside the essay.${languageInstruction}`;
        userPrompt = `Essay topic: ${text}`;
        break;

      case "grammar":
        systemPrompt = `You are an expert English grammar and writing coach. Correct all grammar, spelling, and punctuation errors in the given text. Format your response exactly as:
"# Corrected Text" followed by the fully corrected text as plain paragraphs, then
"## Changes Made" followed by a "- " bullet list explaining each significant correction briefly (max 8 bullets, group similar errors together).${languageInstruction}`;
        userPrompt = `Text to correct:\n${text}`;
        break;

      case "rewrite":
        systemPrompt = `You are an expert writing coach. Rewrite the given text in a ${tone ?? "Formal"} tone/style, keeping the original meaning intact but improving clarity, flow, and word choice. Format your response as "# Rewritten Text" followed by the rewritten text as plain paragraphs. Do not add any other commentary.${languageInstruction}`;
        userPrompt = `Original text:\n${text}`;
        break;

      case "paraphrase":
        systemPrompt = `You are an expert writing coach helping a student make their writing more original in their own words, while keeping the same meaning and facts. Rephrase the given text using different sentence structures and vocabulary, without changing any facts. Format your response as "# Paraphrased Text" followed by the paraphrased text as plain paragraphs.${languageInstruction}`;
        userPrompt = `Original text:\n${text}`;
        break;
    }

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
        { error: "Failed to get a response from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const finishReason = data.candidates?.[0]?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      return NextResponse.json(
        { error: "The response got too long to finish. Try a shorter text or word count." },
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
    console.error("writing-assistant error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}