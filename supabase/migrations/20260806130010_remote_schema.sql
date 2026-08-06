


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_mentor_booked_slots"("p_mentor_id" integer, "p_date" "date") RETURNS TABLE("booking_time" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select booking_time
  from mentor_bookings
  where mentor_id = p_mentor_id
    and booking_date = p_date
    and status in ('pending', 'confirmed');
$$;


ALTER FUNCTION "public"."get_mentor_booked_slots"("p_mentor_id" integer, "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- 1. Profiles me entry
  insert into public.profiles (id, full_name, first_name, exam, streak)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'),
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'exam', 'UPSC'),
    0
  )
  on conflict (id) do nothing;

  -- 2. User Settings me entry
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) RETURNS TABLE("allowed" boolean, "feature_count" integer, "total_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_total_count int;
  v_feature_count int;
begin
  -- Serialize all calls for this (user, date) so the read below
  -- always sees the effect of any write from a call that started
  -- earlier — closes the race window.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text || p_date::text));

  select coalesce(sum(count), 0) into v_total_count
  from usage_limits
  where user_id = p_user_id and date = p_date;

  select coalesce(count, 0) into v_feature_count
  from usage_limits
  where user_id = p_user_id and feature = p_feature and date = p_date;

  if v_feature_count >= p_feature_limit or v_total_count >= p_total_limit then
    return query select false, v_feature_count, v_total_count;
    return;
  end if;

  insert into usage_limits (user_id, feature, date, count)
  values (p_user_id, p_feature, p_date, 1)
  on conflict (user_id, feature, date)
  do update set count = usage_limits.count + 1
  returning usage_limits.count into v_feature_count;

  return query select true, v_feature_count, v_total_count + 1;
end;$$;


ALTER FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "author" "text" NOT NULL,
    "exam" "text" NOT NULL,
    "type" "text" NOT NULL,
    "pages" integer DEFAULT 0 NOT NULL,
    "rating" numeric DEFAULT 0 NOT NULL,
    "downloads" "text" DEFAULT '0'::"text" NOT NULL,
    "icon" "text" DEFAULT '📘'::"text" NOT NULL,
    "is_new" boolean DEFAULT false NOT NULL,
    "premium" boolean DEFAULT false NOT NULL,
    "pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."books_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."books_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."books_id_seq" OWNED BY "public"."books"."id";



CREATE TABLE IF NOT EXISTS "public"."books_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "exam_slug" "text" NOT NULL,
    "book_id" "text" NOT NULL,
    "book_title" "text" NOT NULL,
    "chapter" integer DEFAULT 1 NOT NULL,
    "total_chapters" integer DEFAULT 1 NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."books_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_stats" (
    "user_id" "uuid" NOT NULL,
    "exam_slug" "text" NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "tests_attempted" integer DEFAULT 0 NOT NULL,
    "average_accuracy" integer DEFAULT 0 NOT NULL,
    "study_hours" integer DEFAULT 0 NOT NULL,
    "current_rank" integer DEFAULT 0 NOT NULL,
    "percentile" numeric(5,2) DEFAULT 0 NOT NULL,
    "streak" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."focus_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "exam_slug" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "level" "text" DEFAULT 'low'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "focus_areas_level_check" CHECK (("level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."focus_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."library_collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "book_ids" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."library_collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."library_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "text" NOT NULL,
    "progress_percent" integer DEFAULT 0 NOT NULL,
    "is_favorite" boolean DEFAULT false NOT NULL,
    "is_wishlisted" boolean DEFAULT false NOT NULL,
    "last_opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."library_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "mentor_type" "text" NOT NULL,
    "qualification" "text" NOT NULL,
    "experience_years" integer DEFAULT 0 NOT NULL,
    "expertise" "text" NOT NULL,
    "languages" "text" NOT NULL,
    "bio" "text" NOT NULL,
    "city" "text",
    "address" "text",
    "session_charge" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_proof_path" "text",
    "certificate_paths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."mentor_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mentor_id" integer NOT NULL,
    "session_type" "text" NOT NULL,
    "mode" "text" NOT NULL,
    "booking_date" "date" NOT NULL,
    "booking_time" "text" NOT NULL,
    "duration_minutes" integer DEFAULT 30 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "meeting_link" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mentor_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mentor_id" integer NOT NULL,
    "booking_id" "uuid",
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mentor_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."mentor_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentors" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "mentor_type" "text" NOT NULL,
    "qualification" "text" DEFAULT ''::"text" NOT NULL,
    "experience_years" integer DEFAULT 0 NOT NULL,
    "expertise" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "languages" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "bio" "text" DEFAULT ''::"text" NOT NULL,
    "rating" numeric DEFAULT 0 NOT NULL,
    "total_students" integer DEFAULT 0 NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "response_time_hours" integer DEFAULT 24 NOT NULL,
    "session_charge" integer DEFAULT 0 NOT NULL,
    "city" "text",
    "address" "text",
    "avatar_icon" "text" DEFAULT '🎓'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mentors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."mentors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."mentors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."mentors_id_seq" OWNED BY "public"."mentors"."id";



CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "subject" "text",
    "tags" "text"[],
    "color" "text" DEFAULT '#6366F1'::"text",
    "pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "first_name" "text",
    "exam" "text" DEFAULT 'UPSC'::"text",
    "streak" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rankings" (
    "user_id" "uuid" NOT NULL,
    "exam_slug" "text" NOT NULL,
    "national_rank" integer DEFAULT 0,
    "state_name" "text",
    "state_rank" integer DEFAULT 0,
    "city_name" "text",
    "city_rank" integer DEFAULT 0,
    "percentile" numeric(5,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rankings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revision_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "exam" "text" NOT NULL,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "ease_factor" numeric DEFAULT 2.5 NOT NULL,
    "interval_days" integer DEFAULT 1 NOT NULL,
    "last_reviewed_at" "date",
    "next_review_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revision_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_streak" (
    "user_id" "uuid" NOT NULL,
    "exam_slug" "text" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_study_date" "date",
    "total_study_days" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_streak" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "subject" "text",
    "duration" integer DEFAULT 30,
    "done" boolean DEFAULT false,
    "task_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "test_id" "text",
    "title" "text",
    "exam" "text",
    "score" integer,
    "total" integer,
    "correct" integer,
    "wrong" integer,
    "skipped" integer,
    "accuracy" integer,
    "time_used" integer,
    "subject_breakdown" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."test_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_limits" (
    "user_id" "uuid" NOT NULL,
    "feature" "text" NOT NULL,
    "date" "date" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."usage_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "profile_extra" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "study_preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ai_mentor" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "learning_preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notifications" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "appearance" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "language_region" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."books" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."books_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."mentors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."mentors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books_progress"
    ADD CONSTRAINT "books_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_stats"
    ADD CONSTRAINT "dashboard_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."focus_areas"
    ADD CONSTRAINT "focus_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library_collections"
    ADD CONSTRAINT "library_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library_progress"
    ADD CONSTRAINT "library_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library_progress"
    ADD CONSTRAINT "library_progress_user_id_book_id_key" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."mentor_applications"
    ADD CONSTRAINT "mentor_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_bookings"
    ADD CONSTRAINT "mentor_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "rankings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."revision_items"
    ADD CONSTRAINT "revision_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_streak"
    ADD CONSTRAINT "study_streak_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_limits"
    ADD CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("user_id", "feature", "date");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_books_progress_exam" ON "public"."books_progress" USING "btree" ("exam_slug");



CREATE INDEX "idx_books_progress_user" ON "public"."books_progress" USING "btree" ("user_id");



CREATE INDEX "idx_dashboard_stats_exam" ON "public"."dashboard_stats" USING "btree" ("exam_slug");



CREATE INDEX "idx_dashboard_stats_updated" ON "public"."dashboard_stats" USING "btree" ("updated_at");



CREATE INDEX "idx_focus_exam" ON "public"."focus_areas" USING "btree" ("exam_slug");



CREATE INDEX "idx_focus_user" ON "public"."focus_areas" USING "btree" ("user_id");



CREATE INDEX "idx_rankings_exam" ON "public"."rankings" USING "btree" ("exam_slug");



CREATE INDEX "idx_streak_exam" ON "public"."study_streak" USING "btree" ("exam_slug");



CREATE INDEX "idx_usage_limits_user_date" ON "public"."usage_limits" USING "btree" ("user_id", "date");



ALTER TABLE ONLY "public"."books_progress"
    ADD CONSTRAINT "books_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_stats"
    ADD CONSTRAINT "dashboard_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."focus_areas"
    ADD CONSTRAINT "focus_areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."library_collections"
    ADD CONSTRAINT "library_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."library_progress"
    ADD CONSTRAINT "library_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_applications"
    ADD CONSTRAINT "mentor_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_bookings"
    ADD CONSTRAINT "mentor_bookings_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_bookings"
    ADD CONSTRAINT "mentor_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."mentor_bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revision_items"
    ADD CONSTRAINT "revision_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_streak"
    ADD CONSTRAINT "study_streak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone logged in can view books" ON "public"."books" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone logged in can view mentors" ON "public"."mentors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone logged in can view reviews" ON "public"."mentor_reviews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can cancel/delete their own bookings" ON "public"."mentor_bookings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own bookings" ON "public"."mentor_bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own reviews" ON "public"."mentor_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own books" ON "public"."books_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own focus areas" ON "public"."focus_areas" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own notes" ON "public"."notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own tasks" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own test results" ON "public"."test_results" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own collections" ON "public"."library_collections" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own library progress" ON "public"."library_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own revision items" ON "public"."revision_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own books" ON "public"."books_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own dashboard" ON "public"."dashboard_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own focus areas" ON "public"."focus_areas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own notes" ON "public"."notes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own ranking" ON "public"."rankings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own streak" ON "public"."study_streak" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own test results" ON "public"."test_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own collections" ON "public"."library_collections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own library progress" ON "public"."library_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own revision items" ON "public"."revision_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit their own application" ON "public"."mentor_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own books" ON "public"."books_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own dashboard" ON "public"."dashboard_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own focus areas" ON "public"."focus_areas" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notes" ON "public"."notes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own ranking" ON "public"."rankings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own streak" ON "public"."study_streak" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."mentor_bookings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own collections" ON "public"."library_collections" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own library progress" ON "public"."library_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."mentor_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own revision items" ON "public"."revision_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own books" ON "public"."books_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own dashboard" ON "public"."dashboard_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own focus areas" ON "public"."focus_areas" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notes" ON "public"."notes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own ranking" ON "public"."rankings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own streak" ON "public"."study_streak" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own tasks" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own test results" ON "public"."test_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own application" ON "public"."mentor_applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bookings" ON "public"."mentor_bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own collections" ON "public"."library_collections" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own library progress" ON "public"."library_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own revision items" ON "public"."revision_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."focus_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."library_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."library_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revision_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_streak" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_mentor_booked_slots"("p_mentor_id" integer, "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mentor_booked_slots"("p_mentor_id" integer, "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mentor_booked_slots"("p_mentor_id" integer, "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON SEQUENCE "public"."books_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."books_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."books_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."books_progress" TO "anon";
GRANT ALL ON TABLE "public"."books_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."books_progress" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_stats" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_stats" TO "service_role";



GRANT ALL ON TABLE "public"."focus_areas" TO "anon";
GRANT ALL ON TABLE "public"."focus_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."focus_areas" TO "service_role";



GRANT ALL ON TABLE "public"."library_collections" TO "anon";
GRANT ALL ON TABLE "public"."library_collections" TO "authenticated";
GRANT ALL ON TABLE "public"."library_collections" TO "service_role";



GRANT ALL ON TABLE "public"."library_progress" TO "anon";
GRANT ALL ON TABLE "public"."library_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."library_progress" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_applications" TO "anon";
GRANT ALL ON TABLE "public"."mentor_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_applications" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_bookings" TO "anon";
GRANT ALL ON TABLE "public"."mentor_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_reviews" TO "anon";
GRANT ALL ON TABLE "public"."mentor_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."mentors" TO "anon";
GRANT ALL ON TABLE "public"."mentors" TO "authenticated";
GRANT ALL ON TABLE "public"."mentors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mentors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mentors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mentors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rankings" TO "anon";
GRANT ALL ON TABLE "public"."rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."rankings" TO "service_role";



GRANT ALL ON TABLE "public"."revision_items" TO "anon";
GRANT ALL ON TABLE "public"."revision_items" TO "authenticated";
GRANT ALL ON TABLE "public"."revision_items" TO "service_role";



GRANT ALL ON TABLE "public"."study_streak" TO "anon";
GRANT ALL ON TABLE "public"."study_streak" TO "authenticated";
GRANT ALL ON TABLE "public"."study_streak" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."test_results" TO "anon";
GRANT ALL ON TABLE "public"."test_results" TO "authenticated";
GRANT ALL ON TABLE "public"."test_results" TO "service_role";



GRANT ALL ON TABLE "public"."usage_limits" TO "anon";
GRANT ALL ON TABLE "public"."usage_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_limits" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































