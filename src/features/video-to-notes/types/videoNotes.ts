// ==========================================
// 1. INPUT & CONFIGURATION TYPES
// ==========================================

export type InputSourceType = "youtube" | "upload" | "text";

export interface UploadedVideoMeta {
  file?: File;
  // These three are always set together (see InputSection.tsx's
  // handleFileDrop) — required here, matching File's own required fields,
  // so `config.videoFile.size` etc. type-checks whichever of the two
  // (File | UploadedVideoMeta) videoFile actually holds at render time.
  name: string;
  size: number;
  type: string;
  duration?: number;
  // Object-URL created via URL.createObjectURL(file) for local preview —
  // see InputSection.tsx's handleFileDrop.
  previewUrl?: string;
}

// Every call site in this feature only ever passes a plain language name
// string (e.g. "English", "Hindi") — see constants/languages.ts.
export type LanguageOption = string;

export interface VideoNotesConfig {
  // Support both old and new naming conventions in your UI
  videoUrl?: string;
  youtubeUrl?: string;
  sourceType?: InputSourceType;
  language?: LanguageOption;
  uploadedFile?: UploadedVideoMeta | File | null;
  videoFile?: UploadedVideoMeta | File | null;
}

// ==========================================
// 2. AI GENERATED NOTES STRUCTURE
// ==========================================

export interface ComparisonCard {
  title: string;
  description: string;
  examples?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
}

export interface NoteSection {
  heading: string;
  type?: "bullets" | "comparison" | "code" | string;
  bullets?: string[];
  comparisonCards?: ComparisonCard[];
  codeBlock?: CodeBlock;
}

// Shape of a section as notesService.ts actually receives it from
// /api/video-notes (heading/content), plus the alternate field names
// (title/description/details) it defensively falls back to. This is
// what VideoNotesData.sections is really populated with today — kept
// distinct from NoteSection (the richer, not-yet-rendered structure
// above) rather than forcing the raw API shape to pretend to be it.
export interface RawNoteSection {
  heading?: string;
  title?: string;
  content?: string[] | string;
  description?: string[] | string;
  details?: string[] | string;
}

export interface VideoNotesData {
  title?: string;
  summary?: string;
  keyConcepts?: string[];
  workflow?: string[];
  sections?: RawNoteSection[];

  // notesService.ts always builds this as a pre-formatted markdown string
  // today (see getNotesAsText in NotesOutputSection.tsx, which still
  // handles the NoteSection[] case defensively in case that ever changes).
  notes?: string | NoteSection[];
  generatedAt?: string;

  language?: string;
  duration?: string;
  source?: string;
}

export type GeneratedNotesResult = VideoNotesData;