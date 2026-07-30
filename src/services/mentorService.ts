import { supabase } from "@/lib/supabase";
import { authService } from "./authService";
import { Mentor, MentorBooking, MentorReview, MentorApplication } from "@/types/mentor";

// Converts a raw Supabase row (snake_case) into our Mentor type (camelCase).
function mapMentorRow(row: any): Mentor {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    mentorType: row.mentor_type,
    qualification: row.qualification,
    experienceYears: row.experience_years,
    expertise: row.expertise ?? [],
    languages: row.languages ?? [],
    bio: row.bio,
    rating: Number(row.rating),
    totalStudents: row.total_students,
    verified: row.verified,
    responseTimeHours: row.response_time_hours,
    sessionCharge: row.session_charge,
    city: row.city,
    address: row.address,
    avatarIcon: row.avatar_icon,
  };
}

class MentorService {
  private async getUserId() {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    return user.id;
  }

  // ==========================
  // MENTORS
  // ==========================

  async getAllMentors(): Promise<Mentor[]> {
    const { data, error } = await supabase.from("mentors").select("*").order("rating", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapMentorRow);
  }

  async getMentorById(id: number): Promise<Mentor | null> {
    const { data, error } = await supabase.from("mentors").select("*").eq("id", id).maybeSingle();

    if (error) throw error;

    return data ? mapMentorRow(data) : null;
  }

  // ==========================
  // BOOKINGS
  // ==========================

  async getMyBookings(): Promise<MentorBooking[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("mentor_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("booking_date", { ascending: true });

    if (error) throw error;

    return (data ?? []) as MentorBooking[];
  }

  // Returns just the already-booked time strings for a mentor on a given
  // date (via a security-definer function — see booked_slots_function.sql)
  // so the booking UI can grey out taken slots without seeing whose they are.
  async getBookedSlots(mentorId: number, date: string): Promise<string[]> {
    const { data, error } = await supabase.rpc("get_mentor_booked_slots", {
      p_mentor_id: mentorId,
      p_date: date,
    });

    if (error) throw error;

    return (data ?? []).map((row: any) => row.booking_time);
  }

  async createBooking(booking: {
    mentor_id: number;
    session_type: string;
    mode: "online" | "offline";
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    notes?: string;
  }): Promise<MentorBooking> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("mentor_bookings")
      .insert({ ...booking, user_id: userId, status: "pending" })
      .select()
      .single();

    if (error) throw error;

    return data as MentorBooking;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from("mentor_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) throw error;
  }

  // ==========================
  // REVIEWS
  // ==========================

  async getReviewsForMentor(mentorId: number): Promise<MentorReview[]> {
    const { data, error } = await supabase
      .from("mentor_reviews")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as MentorReview[];
  }

  async submitReview(review: {
    mentor_id: number;
    booking_id?: string;
    rating: number;
    review_text?: string;
  }): Promise<MentorReview> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("mentor_reviews")
      .insert({ ...review, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    return data as MentorReview;
  }

  // ==========================
  // BECOME A MENTOR — applications
  // ==========================

  async getMyApplication(): Promise<MentorApplication | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("mentor_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data as MentorApplication | null;
  }

  async submitApplication(application: {
    name: string;
    category: string;
    mentor_type: string;
    qualification: string;
    experience_years: number;
    expertise: string;
    languages: string;
    bio: string;
    city?: string;
    address?: string;
    session_charge: number;
    id_proof_path?: string;
    certificate_paths?: string[];
  }): Promise<MentorApplication> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("mentor_applications")
      .insert({ ...application, user_id: userId, status: "pending" })
      .select()
      .single();

    if (error) throw error;

    return data as MentorApplication;
  }

  // ==========================
  // DOCUMENT UPLOAD (ID proof + certificates)
  // Stored in a PRIVATE bucket, one folder per user (enforced by storage
  // policies — see mentor_documents.sql), so only the uploader can read
  // their own documents back.
  // ==========================

  async uploadMentorDocument(file: File, label: string): Promise<string> {
    const userId = await this.getUserId();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${userId}/${label}-${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from("mentor-documents").upload(path, file);

    if (error) throw error;

    // We store the path (not a public URL, since the bucket is private).
    // Viewing it later requires generating a signed URL — see the SQL
    // file's comment for how to do that manually during review.
    return path;
  }
}

export const mentorService = new MentorService();

export default mentorService;