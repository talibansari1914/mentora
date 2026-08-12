import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { callAI } from "@/lib/aiProvider";
import { checkAndIncrementUsage } from "@/lib/usageLimit";

export const maxDuration = 60;

type Mode = "essay" | "email" | "application" | "letter" | "grammar" | "rewrite" | "paraphrase";

// Sub-type guidance for the three "template" content types. Each entry is
// plugged into the shared systemPrompt builder below — it only describes
// what's DIFFERENT about that sub-type (audience, purpose, standard
// sections); the shared formatting rules (title line, **Section** headings,
// no raw # or *) are appended once for all of them so every combination
// stays visually consistent with the rest of the app's AI output.
const EMAIL_SUBTYPE_GUIDANCE: Record<string, string> = {
  job: `Write a professional email to a company/HR/employer (e.g. asking about a job opening, following up on an application, requesting an update). Keep it concise and professional.`,
  cover_letter: `Write a cover letter to accompany a job application. Include: a brief opening stating the role being applied for, 1-2 paragraphs connecting the candidate's relevant skills/experience to the role, and a closing paragraph with a call to action.`,
  normal: `Write a normal, everyday email (not job/company related) - friendly but clear, for the purpose described by the user.`,
};

const APPLICATION_SUBTYPE_GUIDANCE: Record<string, string> = {
  job: `Write a formal job application addressed to an employer/HR, requesting to be considered for a position. Follow standard Indian formal-application structure.`,
  leave: `Write a formal leave application addressed to a superior/authority (e.g. Principal, Manager, HOD), clearly stating the reason for leave, the duration (from-to dates if given), and a polite request for approval.`,
  school: `Write a formal application addressed to a School/College authority (e.g. Principal, HOD) - for admission, a certificate request, a bonafide request, or whatever purpose the user describes.`,
  general: `Write a formal application for the purpose described by the user, addressed to the relevant authority. Follow standard Indian formal-application structure.`,
};

const LETTER_SUBTYPE_GUIDANCE: Record<string, string> = {
  formal: `Write a formal letter addressed to an authority/organization (e.g. a government office, a company, an editor). Use a formal, respectful tone throughout.`,
  personal: `Write a personal letter to a friend/family member - warm, informal tone, no strict business-letter structure needed.`,
  complaint: `Write a formal complaint letter. Clearly state the problem, relevant details/evidence, and the resolution being requested. Keep the tone firm but polite, never rude.`,
};

// Shared structural rules for email / application / letter - appended to
// every sub-type's specific guidance above so the AI always produces the
// same predictable document shape, in the syntax renderMarkdownLite.tsx
// understands (see src/lib/renderMarkdownLite.tsx for the full spec).
const TEMPLATE_FORMAT_RULES = `
Format the output exactly like this:
- FIRST line: a short plain-text heading summarizing the purpose (e.g. "Application for Sick Leave", "Cover Letter - Frontend Developer Role"). No symbols before or after it.
- Then, if a formal addressee applies: a few plain lines for "To," the recipient, and the date (skip this block entirely for a normal email or personal letter where it doesn't apply).
- Then the salutation on its own line (e.g. "Dear Sir/Madam," or a name if the user gave one).
- Then the body as plain paragraphs. Bold the single most important phrase per paragraph at most (e.g. a date, a request, a key fact) using **bold** - do not bold entire sentences.
- Then the closing (e.g. "Yours sincerely," / "Regards,") followed by a placeholder line for the sender's name on the next line.
Do NOT use #, ##, numbered lists, or any markdown symbol other than **bold**, *italic*, and <u>underline</u> (used sparingly, at most once, for the single most critical point if there is one).`;

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

    const usage = await checkAndIncrementUsage(supabase, user.id, "writing-assistant");
    if (!usage.allowed) {
      const reason =
        usage.featureCount >= usage.featureLimit
          ? `You've reached today's limit (${usage.featureLimit}) for this feature.`
          : `You've reached today's overall AI usage limit (${usage.totalLimit}).`;
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const {
      mode,
      subType,
      text,
      wordCount,
      tone,
      responseLanguage,
    }: {
      mode: Mode;
      subType?: string;
      text?: string;
      wordCount?: number;
      tone?: string;
      responseLanguage?: string;
    } = await req.json();

    if (!mode || !text?.trim()) {
      return NextResponse.json(
        { error: mode === "essay" ? "Please enter an essay topic." : "Please describe what you need." },
        { status: 400 }
      );
    }

    // email/application/letter always need a sub-type - it's what picks the
    // right standard format below. Validated against the known list rather
    // than trusted as-is, since it gets interpolated into the AI prompt.
    const SUBTYPE_GUIDANCE_BY_MODE: Partial<Record<Mode, Record<string, string>>> = {
      email: EMAIL_SUBTYPE_GUIDANCE,
      application: APPLICATION_SUBTYPE_GUIDANCE,
      letter: LETTER_SUBTYPE_GUIDANCE,
    };
    const subTypeGuidanceMap = SUBTYPE_GUIDANCE_BY_MODE[mode];
    if (subTypeGuidanceMap && (!subType || !subTypeGuidanceMap[subType])) {
      return NextResponse.json(
        { error: "Please choose what this is for." },
        { status: 400 }
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
    let userText = "";

    switch (mode) {
      case "essay":
        systemPrompt = `You are an expert essay-writing coach. Write a well-structured essay of approximately ${wordCount ?? 250} words in a ${tone ?? "Formal"} tone, following the standard essay skeleton below exactly. NEVER print the words "Introduction", "Body", "Topic Sentence", "Support", or "Conclusion" as labels/headings anywhere in the output - they describe the skeleton you must follow, not text to print. Do not use #, ##, or numbered lists.

THE SKELETON (follow this exactly):
1. INTRODUCTION (1 paragraph): one or two general/context-setting statements about the topic (a hook - a quote, a fact, or a broad observation), then a clear essay statement (thesis) that states the specific angle or argument the essay will take.
2. BODY (3-5 paragraphs, one per point, in a deliberate logical order): each body paragraph MUST follow this exact internal shape:
   a. A topic sentence stating that paragraph's single core point. Bold the key word/phrase of the topic sentence with **bold**.
   b. Immediately after, a short "- " bullet list of exactly 3 supports for that point - each one a concrete, specific, real-world anchor (a named scheme/law/event/organization, a real statistic, or a specific example) - never a vague, generic bullet.
   c. A concluding sentence for that paragraph that wraps up the point (can also transition toward the next point).
3. CONCLUSION (1 paragraph): restate the main points briefly (without repeating them word-for-word), then a final forward-looking or thought-provoking comment - ideally circling back to the introduction's hook.

Additional rules:
- Do not open every body paragraph's topic sentence with the same sentence pattern (e.g. never repeat "In the context of X, ..." for point after point) - vary it: a question, a direct claim, a transition from the previous point, or the example itself.
- Across the whole essay, weave in 3 to 4 real quotes, statements, or shers/couplets from real, famous personalities (thinkers, leaders, poets, etc.) relevant to the topic - place them naturally in the introduction/body/conclusion where they strengthen a point, not all bunched together, briefly attributed (e.g. "- Gandhi"). Never invent a fake quote or misattribute one - use a well-known, verifiable one if unsure.
- Never bold more than one phrase per paragraph, and never bold inside a bullet.
Format the output as: FIRST line = the essay title as plain text (no symbols around it), then the introduction paragraph, then each body paragraph (topic sentence + 3-bullet supports + concluding sentence), then the conclusion paragraph.${languageInstruction}`;
        userText = `Essay topic: ${text}`;
        break;

      case "email":
      case "application":
      case "letter": {
        const guidance = subTypeGuidanceMap![subType!];
        const roleLabel = mode === "email" ? "email" : mode === "application" ? "application" : "letter";
        systemPrompt = `You are an expert writing assistant helping an Indian student/professional write a ${roleLabel}. ${guidance}${TEMPLATE_FORMAT_RULES}${languageInstruction}`;
        userText = `Details for this ${roleLabel}: ${text}`;
        break;
      }

      case "grammar":
        systemPrompt = `You are an expert English grammar and writing coach. Correct all grammar, spelling, and punctuation errors in the given text. Do NOT start with #, ##, *, or any markdown heading symbol. Format your response exactly as:
"Corrected Text" as plain text on the first line, then the fully corrected text as plain paragraphs, then a blank line, then
"**Changes Made**" alone on its own line, then a "- " bullet list explaining each significant correction briefly (max 8 bullets, group similar errors together). Bold key terms only, never entire bullets.${languageInstruction}`;
        userText = `Text to correct:\n${text}`;
        break;

      case "rewrite":
        systemPrompt = `You are an expert writing coach. Rewrite the given text in a ${tone ?? "Formal"} tone/style, keeping the original meaning intact but improving clarity, flow, and word choice. Put "Rewritten Text" as plain text on the first line with no symbols around it, then the rewritten text as plain paragraphs. Do not add any other commentary.${languageInstruction}`;
        userText = `Original text:\n${text}`;
        break;

      case "paraphrase":
        systemPrompt = `You are an expert writing coach helping a student make their writing more original in their own words, while keeping the same meaning and facts. Rephrase the given text using different sentence structures and vocabulary, without changing any facts. Put "Paraphrased Text" as plain text on the first line with no symbols around it, then the paraphrased text as plain paragraphs.${languageInstruction}`;
        userText = `Original text:\n${text}`;
        break;
    }

    let answer: string;
    try {
      const result = await callAI({
        task: "writing-assistant",
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
    console.error("writing-assistant error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}