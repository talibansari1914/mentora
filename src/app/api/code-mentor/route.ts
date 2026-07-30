import { NextRequest, NextResponse } from "next/server";

type Mode = "doubt" | "explain" | "debug" | "generate" | "practice";

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Please describe your doubt." },
        { status: 400 }
      );
    }

    if ((mode === "explain" || mode === "debug") && !code?.trim()) {
      return NextResponse.json(
        { error: "Please paste your code." },
        { status: 400 }
      );
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

Format code using fenced code blocks with the language name, like \`\`\`${language} ... \`\`\`. Use "# " for a short title, "## " for section headings, and "- " for bullet points in your explanation text.`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "doubt":
        systemPrompt = `${basePrompt}\n\nAnswer the student's programming doubt clearly and step by step, with a short code example if it helps.`;
        userPrompt = `Language: ${language}\nDoubt: ${question}`;
        break;

      case "explain":
        systemPrompt = `${basePrompt}\n\nExplain what the given code does, step by step. Break down the logic in plain language, and mention what each important part is doing.`;
        userPrompt = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\n${question ? `Extra context from student: ${question}` : ""}`;
        break;

      case "debug":
        systemPrompt = `${basePrompt}\n\nThe student's code has a bug. Find the bug, explain clearly what's wrong and why, then give the corrected full code in a fenced code block.`;
        userPrompt = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\n${errorMessage ? `Error message they're seeing: ${errorMessage}` : "No error message given — find any bugs by reading the code."}\n${question ? `Extra context: ${question}` : ""}`;
        break;

      case "generate":
        systemPrompt = `${basePrompt}\n\nWrite clean, working, well-commented code that does what the student describes. Give the code in a fenced code block, followed by a brief explanation of how it works.`;
        userPrompt = `Language: ${language}\nRequirement: ${question}`;
        break;

      case "practice":
        systemPrompt = `${basePrompt}\n\nGenerate exactly 3 coding practice questions on the given topic, in increasing order of difficulty (Easy, Medium, Hard). For each, give only the problem statement — do NOT give the solution or code.`;
        userPrompt = `Language: ${language}\nTopic: ${question}`;
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
        { error: "The response got too long to finish. Try a shorter/simpler request." },
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
    console.error("code-mentor error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}