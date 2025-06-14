CREATE OR REPLACE FUNCTION get_monthly_leaderboard(year integer, month integer)
RETURNS TABLE (
  id uuid,
  display_name text,
  score numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_scores AS (
    SELECT 
      p.id,
      p.display_name,
      AVG(s.raw_score) as score
    FROM profiles p
    JOIN scores s ON s.user_id = p.id
    WHERE EXTRACT(YEAR FROM s.puzzle_date) = year
    AND EXTRACT(MONTH FROM s.puzzle_date) = month
    GROUP BY p.id, p.display_name
  )
  SELECT 
    ms.id,
    ms.display_name,
    ms.score
  FROM monthly_scores ms
  ORDER BY ms.score ASC;
END;
$$ LANGUAGE plpgsql; 