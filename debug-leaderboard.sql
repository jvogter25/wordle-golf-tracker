-- Debug script to check what data exists in the database

-- Check all users and their scores
SELECT 
  p.display_name,
  p.id as user_id,
  COUNT(s.id) as total_scores,
  s.group_id,
  g.name as group_name
FROM profiles p
LEFT JOIN scores s ON p.id = s.user_id
LEFT JOIN groups g ON s.group_id = g.id
GROUP BY p.id, p.display_name, s.group_id, g.name
ORDER BY p.display_name, g.name;

-- Check today's scores specifically
SELECT 
  p.display_name,
  s.raw_score,
  s.golf_score,
  s.attempts,
  s.puzzle_date,
  g.name as group_name
FROM scores s
JOIN profiles p ON s.user_id = p.id
JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_date = CURRENT_DATE
ORDER BY p.display_name;

-- Test the get_all_time_leaderboard function
SELECT * FROM get_all_time_leaderboard() LIMIT 10; 