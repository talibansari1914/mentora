import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";

export const maxDuration = 60;

type Mode = "doubt" | "explain" | "debug" | "generate" | "practice";

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

    const usage = await checkAndIncrementUsage(supabase, user.id, "code-mentor");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const {
      mode,
      language,
      question,
      code,
      errorMessage,
      personality,
      explanationStyle,
      responseLanguage,
    }: {
      mode: Mode;
      language: string;
      question?: string;
      code?: string;
      errorMessage?: string;
      personality?: string;
      explanationStyle?: string;
      responseLanguage?: string;
    } = await req.json();

    if (!mode || !language) {
      return NextResponse.json(
        { error: "Mode and language are required." },
        { status: 400 }
      );
    }

    if (mode === "doubt" && !question?.trim()) {
      return NextResponse.json({ error: "Please describe your doubt." }, { status: 400 });
    }

    if ((mode === "explain" || mode === "debug") && !code?.trim()) {
      return NextResponse.json({ error: "Please paste your code." }, { status: 400 });
    }

    if (mode === "generate" && !question?.trim()) {
      return NextResponse.json(
        { error: "Please describe what you want the code to do." },
        { status: 400 }
      );
    }

    if (mode === "practice" && !question?.trim()) {
      return NextResponse.json(
        { error: "Please enter a topic for practice questions." },
        { status: 400 }
      );
    }

    const resolvedPersonality = personality || "Friendly";
    const resolvedStyle = explanationStyle || "Detailed";
    const resolvedResponseLanguage =
      responseLanguage === "hindi"
        ? "Hindi"
        : responseLanguage === "hinglish"
        ? "Hinglish (a natural mix of Hindi and English)"
        : "English";

    const basePrompt = `You are an expert programming mentor helping a student learn to code.

Your personality: ${resolvedPersonality}. Let this personality come through in your tone — for example, a "Strict Teacher" is firm and no-nonsense, a "Motivational" mentor encourages the student, an "Exam Coach" is tactical, a "Professional" mentor is neutral and precise, and "Friendly" is warm and approachable.

Your explanation style: ${resolvedStyle}. "Short" means concise. "Detailed" means thorough. "Bullet Points" means prefer lists. "Examples" means anchor concepts in concrete examples. "Story Based" means use an analogy.

Write all explanation text in ${resolvedResponseLanguage} — but keep code, code comments, and error messages in their original form (do not translate code).

Format code using fenced code blocks with the language name, like \`\`\`${language} ... \`\`\`. For explanation text outside code blocks: do NOT start with #, ##, *, or any markdown heading symbol — start directly with a plain-text title on the first line if one is needed. Put any section title alone on its own line wrapped in double asterisks, like **Section Name**. Use "- " for bullet points (two-space-indented "- " for plain, non-bolded sub-points). Use double-asterisk bold **only** for section titles, key terms, function/variable names mentioned in prose, and important concepts — never an entire paragraph. Use <u>...</u> underline very sparingly for at most 1 critical point.`;

    let systemPrompt = "";
    let userText = "";

    switch (mode) {
      case "doubt":
        systemPrompt = `${basePrompt}\n\nAnswer the student's programming doubt clearly and step by step, with a short code example if it helps.`;
        userText = `Language: ${language}\nDoubt: ${question}`;
        break;

      case "explain":
        systemPrompt = `${basePrompt}\n\nExplain what the given code does, step by step. Break down the logic in plain language, and mention what each important part is doing.`;
        userText = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\n${question ? `Extra context from student: ${question}` : ""}`;
        break;

      case "debug":
        systemPrompt = `${basePrompt}\n\nThe student's code has a bug. Find the bug, explain clearly what's wrong and why, then give the corrected full code in a fenced code block.`;
        userText = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\n${errorMessage ? `Error message they're seeing: ${errorMessage}` : "No error message given — find any bugs by reading the code."}\n${question ? `Extra context: ${question}` : ""}`;
        break;

      case "generate":
        systemPrompt = `${basePrompt}\n\nWrite clean, working, well-commented code that does what the student describes. Give the code in a fenced code block, followed by a brief explanation of how it works.`;
        userText = `Language: ${language}\nRequirement: ${question}`;
        break;

      case "practice":
        systemPrompt = `${basePrompt}\n\nGenerate exactly 3 coding practice questions on the given topic, in increasing order of difficulty (Easy, Medium, Hard). For each, give only the problem statement — do NOT give the solution or code.`;
        userText = `Language: ${language}\nTopic: ${question}`;
        break;
    }

    let answer: string;
    try {
      const result = await callAI({
        task: "code-mentor",
        systemPrompt,
        userText,
        maxOutputTokens: 4096,
      });
      answer = result.text;
    } catch {
      return NextResponse.json(
        { error: "Failed to get a response from AI. Please try again in a moment." },
        { status: 502 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: "AI returned an empty answer. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("code-mentor error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}