-- Fix 1: Update existing birthday tournaments to have -2.0 advantage
UPDATE tournaments 
SET birthday_advantage = -2.0 
WHERE tournament_type = 'birthday' 
AND birthday_advantage = 2.0;

-- Fix 2: Update the get_all_time_leaderboard function to use golf_score instead of raw_score
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
           SELECT golf_score  -- Changed from raw_score to golf_score
           FROM scores s2
           WHERE s2.user_id = p.id
           ORDER BY puzzle_date DESC
           LIMIT 20
         ),
         score_stats AS (
           SELECT 
             COUNT(*) as games_played,
             ARRAY_AGG(golf_score ORDER BY golf_score ASC) as sorted_scores  -- Changed from raw_score to golf_score
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

-- Fix 3: Recalculate golf_score for all existing scores to ensure birthday advantages are applied
UPDATE scores 
SET golf_score = CASE 
  WHEN tournament_id IS NOT NULL THEN
    -- Check if this is a birthday tournament and apply advantage
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = scores.tournament_id 
        AND t.tournament_type = 'birthday' 
        AND t.birthday_user_id = scores.user_id
      ) THEN
        -- Apply birthday advantage (-2 strokes)
        (raw_score - 4) + COALESCE((
          SELECT birthday_advantage 
          FROM tournaments t 
          WHERE t.id = scores.tournament_id
        ), 0)
      ELSE
        -- Regular tournament score
        raw_score - 4
      END
  ELSE
    -- Regular score (raw_score - par)
    raw_score - 4
  END
WHERE golf_score != (
  CASE 
    WHEN tournament_id IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM tournaments t 
          WHERE t.id = scores.tournament_id 
          AND t.tournament_type = 'birthday' 
          AND t.birthday_user_id = scores.user_id
        ) THEN
          (raw_score - 4) + COALESCE((
            SELECT birthday_advantage 
            FROM tournaments t 
            WHERE t.id = scores.tournament_id
          ), 0)
        ELSE
          raw_score - 4
        END
    ELSE
      raw_score - 4
    END
);

-- Verify the changes
SELECT 
  t.name as tournament_name,
  t.tournament_type,
  t.birthday_advantage,
  p.display_name,
  s.raw_score,
  s.golf_score,
  s.puzzle_date
FROM scores s
JOIN tournaments t ON s.tournament_id = t.id
JOIN profiles p ON s.user_id = p.id
WHERE t.tournament_type = 'birthday'
ORDER BY s.puzzle_date DESC; 