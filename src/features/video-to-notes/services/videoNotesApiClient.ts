import { VideoNotesData, GeneratedNotesResult, UploadedVideoMeta, RawNoteSection } from "../types/videoNotes";

// Shape of the JSON body returned by /api/video-notes/route.ts. The success
// shape only ever sends title/executiveSummary/sections, but this also
// covers the legacy/alternate field names (summary/notes, etc.) that the
// fallbacks below defensively check for, in case the API response shape
// ever changes.
interface VideoNotesApiResponse {
  title?: string;
  executiveSummary?: string;
  summary?: string;
  notes?: string;
  sections?: RawNoteSection[];
  generatedAt?: string;
  error?: string | { message?: string };
  message?: string;
}

export async function generateVideoNotes(
  sourceType: string = "video",
  identifier: string | File | UploadedVideoMeta | null = "",
  language: string = "English"
): Promise<VideoNotesData> {
  const videoUrl = typeof identifier === "string" ? identifier : identifier?.name || "";
  const youtubeUrl = sourceType === "youtube" && typeof identifier === "string" ? identifier : "";

  const response = await fetch("/api/video-notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceType,
      videoUrl,
      youtubeUrl,
      language,
    }),
  });

  const data = (await response.json()) as VideoNotesApiResponse;

 if (!response.ok) {
    // Check if the error from backend is a JSON object or string
    const errorMessage =
      typeof data.error === "object"
        ? data.error.message || JSON.stringify(data.error)
        : data.error || data.message || "Failed to generate notes from AI.";

    // Custom friendly message for 429 Rate Limits
    if (response.status === 429 || errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
      throw new Error(
        "AI limit reached (Too many requests). Please wait 10-15 seconds and try again!"
      );
    }

    throw new Error(errorMessage);
  }
  // Format sections into clean markdown, avoiding 'undefined'
  // Clean formatting: Converts arrays or sentences into nice bullet points
  const sectionsArray = data.sections || [];
  const formattedNotes = sectionsArray.length > 0
    ? sectionsArray.map((sec: RawNoteSection) => {
        const heading = sec.heading || sec.title || "Key Concept";
        const content = sec.content || sec.description || sec.details || "";
        
        let formattedContent = "";
        if (Array.isArray(content)) {
          formattedContent = content.map((item: string) => `* ${item.trim()}`).join("\n");
        } else if (typeof content === "string") {
          formattedContent = content
            .split(". ")
            .filter(Boolean)
            .map((sentence: string) => `* ${sentence.trim()}${sentence.endsWith(".") ? "" : "."}`)
            .join("\n");
        }

        return `### ${heading}\n${formattedContent}`;
      }).join("\n\n")
    : data.notes || "Detailed notes generated successfully.";
  const summaryText = data.executiveSummary || data.summary || "Summary of the video content.";

  return {
    title: data.title || "Generated Notes",
    language: language,
    summary: summaryText,
    notes: formattedNotes,
    generatedAt: data.generatedAt || new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
    sections: sectionsArray,
  };
}

// Alias for page.tsx compatibility
export const generateNotesApi = generateVideoNotes;

export type { GeneratedNotesResult, VideoNotesData };