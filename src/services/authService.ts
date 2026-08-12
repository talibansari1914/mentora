// src/services/authService.ts

import { createClient } from "@/lib/supabase";
import { createInFlightDeduper } from "@/lib/asyncCache";
import type { User } from "@supabase/supabase-js";

// Cookie-aware browser client — same one used by the login/signup pages —
// so auth state stays in sync with server components/middleware instead of
// living only in localStorage (the old client's behavior).
const supabase = createClient();

// Almost every service in the app calls getCurrentUser() (directly, or via
// getProfile() below) to find out who's logged in, and pages commonly fire
// several of those service calls together via Promise.all. Without this,
// each one of those concurrent calls opened its own network round trip to
// Supabase's auth server for the exact same answer, which is what made
// pages like Dashboard, Analytics, and Settings feel slow to load. This
// dedupes calls that overlap in time — it doesn't change what any caller
// gets back. See src/lib/asyncCache.ts for details.
const dedupeCurrentUser = createInFlightDeduper<User | null>();

export interface SignUpData {
  fullName: string;
  firstName: string;
  email: string;
  password: string;
  exam: string;
  // Cloudflare Turnstile token from the signup form. Optional so this type
  // doesn't force every caller to change, but Supabase Auth will reject the
  // signUp call server-side once CAPTCHA protection is turned on in the
  // Supabase dashboard and no token is supplied.
  captchaToken?: string;
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
    captchaToken,
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
        captchaToken,
      },
    });

    if (error) throw error;

    return data;
  }

  // ==========================
  // LOGIN
  // ==========================

  async signIn(email: string, password: string, captchaToken?: string) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
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
    return dedupeCurrentUser("current-user", async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      return user;
    });
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

  async resetPassword(email: string, captchaToken?: string) {
    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        // Routed through the existing PKCE code-exchange route (see
        // src/app/auth/callback/route.ts) instead of straight to /login, so
        // the recovery link actually establishes a session before the user
        // lands on the page where they type their new password.
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`
            : undefined,
        captchaToken,
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