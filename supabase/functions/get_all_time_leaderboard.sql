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
      u.id,
      u.display_name,
      u.avatar_url,
      COALESCE(
        (SELECT AVG(score)
         FROM (
           SELECT score
           FROM scores s2
           WHERE s2.user_id = u.id
           ORDER BY date DESC
           LIMIT 20
         ) recent_scores
        ),
        0
      ) as handicap,
      (
        SELECT score
        FROM scores s3
        WHERE s3.user_id = u.id
        AND s3.date = CURRENT_DATE
        LIMIT 1
      ) as today
    FROM users u
    WHERE u.id IN (SELECT DISTINCT user_id FROM scores)
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