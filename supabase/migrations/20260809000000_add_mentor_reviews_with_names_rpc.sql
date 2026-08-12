-- Mentor reviews currently render with no reviewer name (always "Mentee")
-- and no review text, because the client can't join mentor_reviews to
-- profiles directly — profiles' RLS policy only allows a user to read
-- their OWN profile row (auth.uid() = id), so a review written by another
-- user always came back with no name attached.
--
-- This mirrors the existing get_mentor_booked_slots pattern: a narrow,
-- security-definer function that returns only the specific field needed
-- (the reviewer's display name), not the reviewer's full profile.
CREATE OR REPLACE FUNCTION "public"."get_mentor_reviews_with_names"("p_mentor_id" integer)
RETURNS TABLE(
  "id" "uuid",
  "mentor_id" integer,
  "booking_id" "uuid",
  "rating" integer,
  "review_text" "text",
  "created_at" timestamp with time zone,
  "reviewer_name" "text"
)
LANGUAGE "sql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
  select
    r.id,
    r.mentor_id,
    r.booking_id,
    r.rating,
    r.review_text,
    r.created_at,
    coalesce(p.full_name, p.first_name, 'Mentee') as reviewer_name
  from mentor_reviews r
  left join profiles p on p.id = r.user_id
  where r.mentor_id = p_mentor_id
  order by r.created_at desc;
$$;

ALTER FUNCTION "public"."get_mentor_reviews_with_names"("p_mentor_id" integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_mentor_reviews_with_names"("p_mentor_id" integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_mentor_reviews_with_names"("p_mentor_id" integer) TO "authenticated";