// Shared across every API route that lets the user pick a content language
// (Notes Generator, Daily Practice, and any future feature) so the prompt
// wording for each language stays consistent and only needs to be written
// once. The three values here match the CONTENT_LANGUAGES options in
// src/components/settings/LanguageRegionSection.tsx (lowercased).

export type ContentLanguage = "english" | "hindi" | "hinglish";

const LANGUAGE_INSTRUCTIONS: Record<ContentLanguage, string> = {
  english: "Write the entire response in clear, simple English.",
  hindi: "Write the entire response in Hindi, using Devanagari script (हिंदी में लिखें).",
  hinglish:
    "Write the entire response in Hinglish — everyday spoken Hindi-English mix, written in the Latin/Roman alphabet (not Devanagari) — the way Indian students actually talk, e.g. \"Isme hum dekhenge ki...\".",
};

/**
 * Returns the system-prompt instruction for the given language.
 * Falls back to English for anything missing/unrecognized (e.g. an older
 * client that doesn't send a language field yet).
 */
export function getLanguageInstruction(language?: string): string {
  return LANGUAGE_INSTRUCTIONS[(language as ContentLanguage) ?? "english"] ?? LANGUAGE_INSTRUCTIONS.english;
}