import { NextRequest, NextResponse } from "next/server";

type Mode = "explain" | "summary" | "notes" | "quiz" | "translate";
type Language = "english" | "hindi" | "hinglish";

// Converts our internal language code into a clear instruction for the model.
function languageName(lang: Language): string {
  if (lang === "hindi") return "Hindi";
  if (lang === "hinglish") return "Hinglish (a natural mix of Hindi and English, written in Roman script)";
  return "English";
}

export async function POST(req: NextRequest) {
  try {
    const {
      mode,
      text,
      language,
      summaryType,
      notesType,
      questionCount,
      pyqStyle,
    }: {
      mode: Mode;
      text: string;
      language: Language;
      summaryType?: "chapter" | "page" | "book" | "bullet";
      notesType?: "auto" | "short" | "revision" | "flashcards";
      questionCount?: number;
      pyqStyle?: boolean;
    } = await req.json();

    if (!mode || !text?.trim()) {
      return NextResponse.json(
        { error: "Please paste some text from the book first." },
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

    const lang = languageName(language ?? "english");
    // Shared formatting rule reused across every mode below, so the frontend
    // renderer (the same "# / ## / -" mini-markdown used elsewhere) always works.
    const formatRule = `Formatting: use "# " for a title, "## " for section headings, and "- " for bullet points. Write the entire response in ${lang}.`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "explain":
        systemPrompt = `You are an expert tutor. Explain the given book passage in simple, easy-to-understand language, as if explaining it to a beginner. Break it into the key ideas. ${formatRule}`;
        userPrompt = `Explain this passage:\n\n${text}`;
        break;

      case "summary": {
        const scopeLabel =
          summaryType === "chapter"
            ? "chapter"
            : summaryType === "page"
            ? "page"
            : summaryType === "book"
            ? "book"
            : "text";
        const bulletInstruction =
          summaryType === "bullet"
            ? "Present the entire summary as bullet points."
            : "Present the summary as short paragraphs.";
        systemPrompt = `You are an expert study-notes writer. Summarize the given ${scopeLabel} text, keeping only the most important points a student needs for exam revision. ${bulletInstruction} ${formatRule}`;
        userPrompt = `Summarize this ${scopeLabel}:\n\n${text}`;
        break;
      }

      case "notes": {
        const styleInstruction =
          notesType === "short"
            ? "Keep the notes very short — only the most critical points."
            : notesType === "revision"
            ? "Format as quick revision notes — dense, scannable, exam-focused."
            : notesType === "flashcards"
            ? 'Format as flashcards: for each key concept, write "## Q: <question>" followed by "- A: <answer>".'
            : "Write complete, well-organized notes covering everything important in the text.";
        systemPrompt = `You are an expert note-maker for competitive exam students. ${styleInstruction} ${formatRule}`;
        userPrompt = `Make notes from this text:\n\n${text}`;
        break;
      }

      case "quiz": {
        const count = questionCount ?? 5;
        const styleInstruction = pyqStyle
          ? "Write them in the style of real Previous Year Questions (PYQs) for Indian competitive exams."
          : "Write them as standard practice MCQs.";
        systemPrompt = `You are an expert question setter. Create exactly ${count} multiple-choice questions based on the given text. ${styleInstruction} For each question, give 4 options labeled A-D. After all questions, add a "## Answer Key" section listing the correct option and a one-line explanation for each. ${formatRule}`;
        userPrompt = `Create a quiz from this text:\n\n${text}`;
        break;
      }

      case "translate": {
        const targetLabel =
          language === "hindi" ? "Hindi" : language === "hinglish" ? "Hinglish" : "English";
        systemPrompt = `You are an expert translator. Translate the given text into ${targetLabel}, keeping the meaning accurate and the tone natural (not a robotic word-for-word translation). Just return the translated text directly — no title, no extra commentary, no markdown formatting.`;
        userPrompt = `Translate this text:\n\n${text}`;
        break;
      }
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
        { error: "The response got too long to finish. Try pasting a shorter passage." },
        { status: 502 }
      );
    }

    const result: string =
      data.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";

    if (!result) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("book-tools error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}