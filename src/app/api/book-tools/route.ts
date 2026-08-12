import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";

export const maxDuration = 60;

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

    const usage = await checkAndIncrementUsage(supabase, user.id, "book-tools");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

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

    const lang = languageName(language ?? "english");
    // Shared formatting rule reused across every mode below (except
    // "translate", which intentionally returns plain prose with no markdown).
    const formatRule = `Formatting: do NOT start with #, ##, *, or any markdown heading symbol — start directly with the title as plain text on the first line. Put every section title alone on its own line wrapped in double asterisks, like **Section Name** — nothing else on that line. Keep generous blank-line spacing between sections. Use double-asterisk bold **only** for section titles, key terms, and important concepts — never an entire paragraph. Use single-asterisk italics *only* for scientific names, foreign words, or rare emphasis. Use <u>...</u> underline very sparingly, at most 1-2 critical points. Use "- " for bullet points (two-space-indented "- " for plain, non-bolded sub-points). Avoid unnecessary emojis — at most one per section. Write the entire response in ${lang}.`;

    let systemPrompt = "";
    let userText = "";

    switch (mode) {
      case "explain":
        systemPrompt = `You are an expert tutor. Explain the given book passage in simple, easy-to-understand language, as if explaining it to a beginner. Break it into the key ideas. ${formatRule}`;
        userText = `Explain this passage:\n\n${text}`;
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
        userText = `Summarize this ${scopeLabel}:\n\n${text}`;
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
        userText = `Make notes from this text:\n\n${text}`;
        break;
      }

      case "quiz": {
        const count = questionCount ?? 5;
        const styleInstruction = pyqStyle
          ? "Write them in the style of real Previous Year Questions (PYQs) for Indian competitive exams."
          : "Write them as standard practice MCQs.";
        systemPrompt = `You are an expert question setter. Create exactly ${count} multiple-choice questions based on the given text. ${styleInstruction} For each question, give 4 options labeled A-D. After all questions, add a "## Answer Key" section listing the correct option and a one-line explanation for each. ${formatRule}`;
        userText = `Create a quiz from this text:\n\n${text}`;
        break;
      }

      case "translate": {
        const targetLabel =
          language === "hindi" ? "Hindi" : language === "hinglish" ? "Hinglish" : "English";
        systemPrompt = `You are an expert translator. Translate the given text into ${targetLabel}, keeping the meaning accurate and the tone natural (not a robotic word-for-word translation). Just return the translated text directly — no title, no extra commentary, no markdown formatting.`;
        userText = `Translate this text:\n\n${text}`;
        break;
      }
    }

    let result: string;
    try {
      const aiResult = await callAI({
        task: "book-tools",
        systemPrompt,
        userText,
        maxOutputTokens: 4096,
      });
      result = aiResult.text;
    } catch {
      return NextResponse.json(
        { error: "Failed to get a response from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

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