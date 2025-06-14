CREATE OR REPLACE FUNCTION get_all_time_leaderboard()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  handicap numeric,
  today integer
) AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT 
      p.id,
      p.display_name,
      p.avatar_url,
      COALESCE(
        (SELECT AVG(raw_score)
         FROM (
           SELECT raw_score
           FROM scores s2
           WHERE s2.user_id = p.id
           ORDER BY puzzle_date DESC
           LIMIT 20
         ) recent_scores
        ),
        0
      ) as handicap,
      (
        SELECT attempts
        FROM scores s3
        WHERE s3.user_id = p.id
        AND s3.puzzle_date = CURRENT_DATE
        LIMIT 1
      ) as today
    FROM profiles p
    WHERE p.id IN (SELECT DISTINCT user_id FROM scores)
  )
  SELECT 
    us.id,
    us.display_name,
    us.avatar_url,
    us.handicap,
    us.today
  FROM user_scores us
  ORDER BY us.handicap ASC;
END;
$$ LANGUAGE plpgsql; 