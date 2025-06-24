-- Revert the RPC function to use raw_score like it was working before
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
           SELECT raw_score  -- Changed back to raw_score
           FROM scores s2
           WHERE s2.user_id = p.id
           ORDER BY puzzle_date DESC
           LIMIT 20
         ),
         score_stats AS (
           SELECT 
             COUNT(*) as games_played,
             ARRAY_AGG(raw_score ORDER BY raw_score) as sorted_scores
           FROM recent_scores
         )
         SELECT 
           CASE 
             WHEN games_played >= 5 THEN
               -- Calculate handicap from best 8 of last 20 scores
               (SELECT AVG(score)::numeric 
                FROM (
                  SELECT UNNEST(sorted_scores[1:LEAST(8, games_played)]) as score
                ) best_scores) - 4  -- Subtract par
             ELSE 0
           END
         FROM score_stats), 0
      ) as handicap,
      -- Get today's score  
      (SELECT raw_score
       FROM scores s3 
       WHERE s3.user_id = p.id 
         AND s3.puzzle_date = CURRENT_DATE 
       LIMIT 1) as today
    FROM profiles p
    WHERE EXISTS (
      SELECT 1 FROM scores s WHERE s.user_id = p.id
    )
  )
  SELECT * FROM user_scores
  ORDER BY handicap ASC;
END;
$$ LANGUAGE plpgsql; 