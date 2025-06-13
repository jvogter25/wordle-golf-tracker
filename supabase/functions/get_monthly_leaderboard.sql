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
      u.id,
      u.display_name,
      AVG(s.score) as score
    FROM users u
    JOIN scores s ON s.user_id = u.id
    WHERE EXTRACT(YEAR FROM s.date) = year
    AND EXTRACT(MONTH FROM s.date) = month
    GROUP BY u.id, u.display_name
  )
  SELECT 
    ms.id,
    ms.display_name,
    ms.score
  FROM monthly_scores ms
  ORDER BY ms.score ASC;
END;
$$ LANGUAGE plpgsql; 