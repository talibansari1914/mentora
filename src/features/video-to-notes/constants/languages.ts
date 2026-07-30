/*
Purpose:
Stores constant configuration data for supported output languages in notes generation.
Inputs:
N/A
Returns:
Array of language configuration objects.
Future:
Can be expanded to support regional Indian languages (Tamil, Telugu, Bengali) as Mentora scales.
*/

import { LanguageOption } from "../types/videoNotes";

export interface LanguageItem {
  id: LanguageOption;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageItem[] = [
  { id: "English", label: "English", flag: "🇬🇧" },
  { id: "Hindi", label: "Hindi (हिंदी)", flag: "🇮🇳" },
  { id: "Hinglish", label: "Hinglish", flag: "🇮🇳" },
];