import { createClient } from "@/lib/supabase";
import { authService } from "./authService";
import { Mentor, MentorBooking, MentorReview, MentorReviewWithReviewer, MentorApplication, MentorCategory, MentorType } from "@/types/mentor";
import { createInFlightDeduper } from "@/lib/asyncCache";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous.
const supabase = createClient();

// Deduping getUserId() so that if a page ever calls more than one of this
// class's user-scoped methods at the same time via Promise.all, they share
// a single auth check instead of each opening their own — see
// src/lib/asyncCache.ts.
const dedupeUserId = createInFlightDeduper<string>();

// Raw Supabase row shape (snake_case) for the `mentors` table.
interface MentorRow {
  id: number;
  name: string;
  category: MentorCategory;
  mentor_type: MentorType;
  qualification: string;
  experience_years: number;
  expertise: string[] | null;
  languages: string[] | null;
  bio: string;
  rating: number;
  total_students: number;
  verified: boolean;
  response_time_hours: number;
  session_charge: number;
  city: string | null;
  address: string | null;
  avatar_icon: string;
}

// Converts a raw Supabase row (snake_case) into our Mentor type (camelCase).
function mapMentorRow(row: MentorRow): Mentor {
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
    return dedupeUserId("user-id", async () => {
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated.");
      }

      return user.id;
    });
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

    return (data ?? []).map((row: { booking_time: string }) => row.booking_time);
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
    // Defense-in-depth: scope this update to the current user's own bookings.
    // Without this .eq("user_id", ...), a logged-in user who somehow learns
    // another user's booking ID (e.g. a leaked link, a predictable ID) could
    // cancel someone else's session, with only the Supabase RLS policy
    // standing between them and that — this makes the intent explicit in
    // the query itself too, not just in the database policy.
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("mentor_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  // ==========================
  // REVIEWS
  // ==========================

  // Uses get_mentor_reviews_with_names (a security-definer RPC — see the
  // migration of the same name) instead of a plain select, because a
  // direct client-side join to `profiles` for the reviewer's name would
  // be blocked by profiles' RLS policy (a user can only read their own
  // profile row). The RPC returns just the reviewer's display name,
  // nothing else from their profile.
  async getReviewsForMentor(mentorId: number): Promise<MentorReviewWithReviewer[]> {
    const { data, error } = await supabase.rpc("get_mentor_reviews_with_names", {
      p_mentor_id: mentorId,
    });

    if (error) throw error;

    return (data ?? []) as MentorReviewWithReviewer[];
  }

  async submitReview(review: {
    mentor_id: number;
    booking_id?: string;
    rating: number;
    review_text?: string;
  }): Promise<MentorReview> {
    const userId = await this.getUserId();

    // Defense-in-depth: this is a client-side call, so a technically savvy
    // user could otherwise invoke submitReview() directly (e.g. via browser
    // devtools) with an arbitrary mentor_id/booking_id and post a review for
    // a mentor they never actually booked a session with. Verify the booking
    // belongs to this user and was completed before allowing the review.
    if (review.booking_id) {
      const { data: bookingRow, error: bookingError } = await supabase
        .from("mentor_bookings")
        .select("id, user_id, mentor_id, status")
        .eq("id", review.booking_id)
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingRow || bookingRow.user_id !== userId) {
        throw new Error("You can only review sessions you've booked.");
      }
      if (bookingRow.mentor_id !== review.mentor_id) {
        throw new Error("This booking doesn't match the selected mentor.");
      }
      if (bookingRow.status !== "completed") {
        throw new Error("You can only review a session after it's completed.");
      }
    }

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