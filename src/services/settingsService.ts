import { supabase } from "@/lib/supabase";
import { authService } from "./authService";

export interface ProfileExtra {
  bio: string;
  country: string;
  dob: string;
  gender: string;
  username: string;
  mobile: string;
  timezone: string;
}

export interface StudyPreferences {
  dailyGoalHours: number;
  weeklyGoalHours: number;
  preferredTime: string;
  preferredSubjects: string[];
  studyLevel: string;
  reminderTime: string;
  revisionFrequency: string;
}

export interface AiMentorSettings {
  personality: string;
  explanationStyle: string;
  language: string;
  rememberProgress: boolean;
  autoGenerateNotes: boolean;
  autoGenerateFlashcards: boolean;
  autoGenerateQuiz: boolean;
  autoGenerateSummary: boolean;
}

export interface LearningPreferences {
  difficultyLevel: string;
  questionFrequency: string;
  dailyQuiz: boolean;
  weeklyMockTest: boolean;
  adaptiveLearning: boolean;
  spacedRepetition: boolean;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  mockTestReminder: boolean;
  assignmentReminder: boolean;
  revisionReminder: boolean;
  achievementNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface AppearanceSettings {
  theme: string;
  accentColor: string;
  fontSize: string;
  compactMode: boolean;
}

export interface LanguageRegionSettings {
  appLanguage: string;
  contentLanguage: string;
  dateFormat: string;
  timeFormat: string;
}

export interface UserSettings {
  user_id?: string;
  profile_extra: ProfileExtra;
  study_preferences: StudyPreferences;
  ai_mentor: AiMentorSettings;
  learning_preferences: LearningPreferences;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  language_region: LanguageRegionSettings;
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile_extra: {
    bio: "",
    country: "India",
    dob: "",
    gender: "",
    username: "",
    mobile: "",
    timezone: "Asia/Kolkata",
  },
  study_preferences: {
    dailyGoalHours: 4,
    weeklyGoalHours: 28,
    preferredTime: "Morning",
    preferredSubjects: [],
    studyLevel: "Intermediate",
    reminderTime: "07:00",
    revisionFrequency: "Weekly",
  },
  ai_mentor: {
    personality: "Friendly",
    explanationStyle: "Detailed",
    language: "English",
    rememberProgress: true,
    autoGenerateNotes: false,
    autoGenerateFlashcards: false,
    autoGenerateQuiz: false,
    autoGenerateSummary: false,
  },
  learning_preferences: {
    difficultyLevel: "Medium",
    questionFrequency: "Daily",
    dailyQuiz: true,
    weeklyMockTest: true,
    adaptiveLearning: true,
    spacedRepetition: true,
  },
  notifications: {
    dailyReminder: true,
    mockTestReminder: true,
    assignmentReminder: true,
    revisionReminder: true,
    achievementNotifications: true,
    emailNotifications: false,
    pushNotifications: false,
  },
  appearance: {
    theme: "Dark",
    accentColor: "#F59E0B",
    fontSize: "Medium",
    compactMode: false,
  },
  language_region: {
    appLanguage: "English",
    contentLanguage: "English",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour",
  },
};

class SettingsService {
  private async getUserId() {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    return user.id;
  }

  // ==========================
  // GET ALL SETTINGS (merged with defaults)
  // ==========================

  async getSettings(): Promise<UserSettings> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return DEFAULT_SETTINGS;
    }

    return {
      user_id: data.user_id,
      profile_extra: { ...DEFAULT_SETTINGS.profile_extra, ...(data.profile_extra ?? {}) },
      study_preferences: { ...DEFAULT_SETTINGS.study_preferences, ...(data.study_preferences ?? {}) },
      ai_mentor: { ...DEFAULT_SETTINGS.ai_mentor, ...(data.ai_mentor ?? {}) },
      learning_preferences: { ...DEFAULT_SETTINGS.learning_preferences, ...(data.learning_preferences ?? {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(data.notifications ?? {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(data.appearance ?? {}) },
      language_region: { ...DEFAULT_SETTINGS.language_region, ...(data.language_region ?? {}) },
    };
  }

  // ==========================
  // UPDATE ONE SECTION (upsert — creates the row on first save)
  // ==========================

  async updateSection<K extends keyof Omit<UserSettings, "user_id">>(
    section: K,
    value: UserSettings[K]
  ): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          [section]: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
  }

  // ==========================
  // EXPORT ALL USER DATA (Download My Data)
  // ==========================

  async exportMyData(): Promise<Record<string, any>> {
    const userId = await this.getUserId();

    const [profile, settings, tests, tasks, revisionItems] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("test_results").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
      supabase.from("revision_items").select("*").eq("user_id", userId),
    ]);

    return {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      settings: settings.data ?? null,
      test_results: tests.data ?? [],
      tasks: tasks.data ?? [],
      revision_items: revisionItems.data ?? [],
    };
  }
}

export const settingsService = new SettingsService();

export default settingsService;