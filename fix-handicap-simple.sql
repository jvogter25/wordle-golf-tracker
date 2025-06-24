-- Simpler version of the handicap function that should work reliably
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
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    COALESCE(
      -- Calculate handicap from recent scores
      (SELECT 
         CASE 
           WHEN COUNT(*) >= 5 THEN 
             -- Use best 8 of last 20 scores for handicap calculation
             (SELECT AVG(golf_score)::numeric 
              FROM (
                SELECT s2.golf_score
                FROM scores s2 
                WHERE s2.user_id = p.id 
                  AND s2.golf_score IS NOT NULL
                ORDER BY s2.puzzle_date DESC 
                LIMIT 20
              ) recent_scores
              ORDER BY golf_score
              LIMIT 8)
           ELSE 0
         END
       FROM scores s3 
       WHERE s3.user_id = p.id AND s3.golf_score IS NOT NULL
      ), 0
    ) as handicap,
    -- Get today's score
    (SELECT s4.raw_score
     FROM scores s4 
     WHERE s4.user_id = p.id 
       AND s4.puzzle_date = CURRENT_DATE 
     LIMIT 1) as today
  FROM profiles p
  WHERE EXISTS (
    SELECT 1 FROM scores s5 WHERE s5.user_id = p.id
  )
  ORDER BY handicap ASC;
END;
$$ LANGUAGE plpgsql; 