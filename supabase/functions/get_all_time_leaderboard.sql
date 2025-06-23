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
        (WITH recent_scores AS (
           SELECT raw_score
           FROM scores s2
           WHERE s2.user_id = p.id
           ORDER BY puzzle_date DESC
           LIMIT 20
         ),
         score_stats AS (
           SELECT 
             COUNT(*) as games_played,
             ARRAY_AGG(raw_score ORDER BY raw_score ASC) as sorted_scores
           FROM recent_scores
         )
         SELECT 
           CASE 
             WHEN games_played < 3 THEN 0
             WHEN games_played >= 20 THEN 
               -- Best 8 of 20, apply USGA multiplier
               ROUND((
                 (sorted_scores[1] + sorted_scores[2] + sorted_scores[3] + sorted_scores[4] + 
                  sorted_scores[5] + sorted_scores[6] + sorted_scores[7] + sorted_scores[8]) / 8.0 * 0.96
               )::numeric, 1)
             WHEN games_played >= 15 THEN 
               -- Best 6 of 15-19
               ROUND((
                 (sorted_scores[1] + sorted_scores[2] + sorted_scores[3] + 
                  sorted_scores[4] + sorted_scores[5] + sorted_scores[6]) / 6.0 * 0.96
               )::numeric, 1)
             WHEN games_played >= 10 THEN 
               -- Best 4 of 10-14
               ROUND((
                 (sorted_scores[1] + sorted_scores[2] + sorted_scores[3] + sorted_scores[4]) / 4.0 * 0.96
               )::numeric, 1)
             WHEN games_played >= 6 THEN 
               -- Best 3 of 6-9
               ROUND((
                 (sorted_scores[1] + sorted_scores[2] + sorted_scores[3]) / 3.0 * 0.96
               )::numeric, 1)
             ELSE 
               -- Best 2 of 3-5
               ROUND((
                 (sorted_scores[1] + sorted_scores[2]) / 2.0 * 0.96
               )::numeric, 1)
           END
         FROM score_stats
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
    GREATEST(0, us.handicap) as handicap, -- Ensure handicap is never negative
    us.today
  FROM user_scores us
  ORDER BY us.handicap ASC;
END;
$$ LANGUAGE plpgsql; 