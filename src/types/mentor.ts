// Shared type definitions for the Mentor Booking module.

export type MentorCategory = "academic" | "skill" | "career";
export type MentorType = "online" | "offline" | "hybrid";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Mentor {
  id: number;
  name: string;
  category: MentorCategory;
  mentorType: MentorType;
  qualification: string;
  experienceYears: number;
  expertise: string[];
  languages: string[];
  bio: string;
  rating: number;
  totalStudents: number;
  verified: boolean;
  responseTimeHours: number;
  sessionCharge: number; // in INR
  city: string | null;
  address: string | null;
  avatarIcon: string;
}

export interface MentorBooking {
  id: string;
  user_id?: string;
  mentor_id: number;
  session_type: string;
  mode: "online" | "offline";
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // e.g. "10:00 AM"
  duration_minutes: number;
  status: BookingStatus;
  meeting_link: string | null;
  notes: string | null;
  created_at?: string;
}

export interface MentorReview {
  id: string;
  user_id?: string;
  mentor_id: number;
  booking_id: string | null;
  rating: number;
  review_text: string | null;
  created_at?: string;
}

export interface MentorApplication {
  id: string;
  user_id?: string;
  name: string;
  category: MentorCategory;
  mentor_type: MentorType;
  qualification: string;
  experience_years: number;
  expertise: string;
  languages: string;
  bio: string;
  city: string | null;
  address: string | null;
  session_charge: number;
  id_proof_path: string | null;
  certificate_paths: string[];
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}