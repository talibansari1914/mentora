// ==========================================
// 1. INPUT & CONFIGURATION TYPES
// ==========================================

export type InputSourceType = "youtube" | "upload" | "text" | string;

export interface UploadedVideoMeta {
  name?: string;
  size?: number;
  type?: string;
  duration?: number;
  file?: any; // Fixes: 'file' does not exist in UploadedVideoMeta
  [key: string]: any;
}

// Allows both object options and plain string codes without conflicts
export type LanguageOption =
  | string
  | {
      code: string;
      label: string;
      flag?: string;
      [key: string]: any;
    }
  | any;

export interface VideoNotesConfig {
  // Support both old and new naming conventions in your UI
  videoUrl?: string;
  youtubeUrl?: string; // Fixes: 'youtubeUrl' does not exist
  sourceType?: InputSourceType;
  language?: string | LanguageOption | any; // Fixes language string/object mismatch
  uploadedFile?: UploadedVideoMeta | File | null;
  videoFile?: UploadedVideoMeta | File | any; // Fixes: 'videoFile' does not exist
  [key: string]: any;
}

// ==========================================
// 2. AI GENERATED NOTES STRUCTURE
// ==========================================

export interface ComparisonCard {
  title: string;
  description: string;
  examples?: string;
  [key: string]: any;
}

export interface CodeBlock {
  language: string;
  code: string;
  [key: string]: any;
}

export interface NoteSection {
  heading: string;
  type?: "bullets" | "comparison" | "code" | string;
  bullets?: string[];
  comparisonCards?: ComparisonCard[];
  codeBlock?: CodeBlock;
  [key: string]: any;
}

export interface VideoNotesData {
  title?: string;
  summary?: string;
  keyConcepts?: string[];
  workflow?: string[];
  sections?: NoteSection[];
  
  // Fixes: 'notes' and 'generatedAt' do not exist in NotesOutputSection & notesService
  notes?: NoteSection[] | string | any;
  generatedAt?: string | Date | any;
  
  language?: string;
  duration?: string;
  source?: string;
  [key: string]: any;
}

export type GeneratedNotesResult = VideoNotesData;