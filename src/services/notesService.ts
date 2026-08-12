import { createClient } from "@/lib/supabase";

// Same cookie-aware singleton client as authService/dashboardService/etc —
// created explicitly here so this file's session source is unambiguous.
const supabase = createClient();

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  color: string;
  pinned: boolean;
}

export interface NoteInput {
  title: string;
  content: string;
  subject: string;
  tags: string[];
  color: string;
}

// Raw Supabase row shape (snake_case) for the `notes` table.
interface NoteRow {
  id: string;
  title: string;
  content: string | null;
  subject: string | null;
  tags: string[] | null;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Converts a raw Supabase row (snake_case) into our Note type (camelCase).
function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content ?? "",
    subject: row.subject ?? "Other",
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    color: row.color,
    pinned: row.pinned,
  };
}

class NotesService {
  // ==========================
  // GET ALL NOTES (current user only — enforced by RLS too)
  // ==========================
  async getAllNotes(): Promise<Note[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapRow);
  }

  // ==========================
  // CREATE NOTE
  // ==========================
  async createNote(input: NoteInput): Promise<Note> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        subject: input.subject,
        tags: input.tags,
        color: input.color,
      })
      .select()
      .single();

    if (error) throw error;

    return mapRow(data);
  }

  // ==========================
  // UPDATE NOTE
  // ==========================
  async updateNote(id: string, input: NoteInput): Promise<Note> {
    const { data, error } = await supabase
      .from("notes")
      .update({
        title: input.title,
        content: input.content,
        subject: input.subject,
        tags: input.tags,
        color: input.color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapRow(data);
  }

  // ==========================
  // TOGGLE PIN
  // ==========================
  async togglePin(id: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from("notes")
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  // ==========================
  // DELETE NOTE
  // ==========================
  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) throw error;
  }
}

export const notesService = new NotesService();

export default notesService;