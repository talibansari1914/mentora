// src/services/authService.ts

import { supabase } from "@/lib/supabase";

export interface SignUpData {
  fullName: string;
  firstName: string;
  email: string;
  password: string;
  exam: string;
}

export interface UpdateProfileData {
  full_name?: string;
  first_name?: string;
  exam?: string;
  streak?: number;
}

class AuthService {
  // ==========================
  // EXAM NORMALIZER
  // ==========================

  private normalizeExam(exam: string): string {
    const value = exam.trim().toUpperCase();

    const map: Record<string, string> = {
      UPSC: "UPSC",

      JEE: "JEE",
      "JEE MAIN": "JEE",
      "JEE MAINS": "JEE",
      "JEE ADVANCED": "JEE",

      NEET: "NEET",
      "NEET UG": "NEET",

      SSC: "SSC",

      BANKING: "BANKING",
      BANK: "BANKING",

      GATE: "GATE",

      ENGINEERING: "ENGINEERING",

      CAT: "CAT",
    };

    return map[value] ?? value;
  }

  // ==========================
  // SIGN UP
  // ==========================

  async signUp({
    fullName,
    firstName,
    email,
    password,
    exam,
  }: SignUpData) {
    const normalizedExam = this.normalizeExam(exam);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          exam: normalizedExam,
        },
      },
    });

    if (error) throw error;

    return data;
  }

  // ==========================
  // LOGIN
  // ==========================

  async signIn(email: string, password: string) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    return data;
  }

  // ==========================
  // LOGOUT
  // ==========================

  async signOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) throw error;
  }

  // ==========================
  // IS LOGGED IN
  // ==========================

  async isLoggedIn() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return !!session;
  }

  // ==========================
  // CURRENT USER
  // ==========================

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    return user;
  }
    // ==========================
  // CURRENT SESSION
  // ==========================

  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return session;
  }

  // ==========================
  // REFRESH SESSION
  // ==========================

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    return data.session;
  }

  // ==========================
  // PROFILE
  // ==========================

  async getProfile() {
    const user = await this.getCurrentUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    // No profile row yet (e.g. the backfill/trigger hasn't run for this
    // account) — return sensible defaults instead of throwing, so pages
    // that call getProfile() don't crash.
    if (!data) {
      return {
        id: user.id,
        full_name: "Student",
        first_name: "Student",
        exam: "UPSC",
        streak: 0,
      };
    }

    return {
      ...data,
      exam: this.normalizeExam(data.exam ?? "UPSC"),
    };
  }

  // ==========================
  // UPDATE PROFILE
  // ==========================

  async updateProfile(payload: UpdateProfileData) {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const updatePayload = {
      ...payload,
      exam: payload.exam
        ? this.normalizeExam(payload.exam)
        : undefined,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updatePayload })
      .select()
      .maybeSingle();

    if (error) throw error;

    return {
      ...data,
      exam: this.normalizeExam(data?.exam ?? "UPSC"),
    };
  }
    // ==========================
  // RESET PASSWORD
  // ==========================

  async resetPassword(email: string) {
    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      });

    if (error) throw error;
  }

  // ==========================
  // UPDATE PASSWORD
  // ==========================

  async updatePassword(password: string) {
    const { data, error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) throw error;

    return data;
  }

  // ==========================
  // AUTH STATE CHANGE
  // ==========================

  onAuthStateChange(
    callback: Parameters<
      typeof supabase.auth.onAuthStateChange
    >[0]
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // ==========================
  // DELETE ACCOUNT
  // (Future Admin/API Support)
  // ==========================

  async deleteAccount() {
    throw new Error(
      "Account deletion should be handled securely through a backend API."
    );
  }
}

export const authService = new AuthService();

export default authService;