REVOKE ALL ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."try_increment_usage"("p_user_id" "uuid", "p_feature" "text", "p_date" "date", "p_feature_limit" integer, "p_total_limit" integer) TO "authenticated";