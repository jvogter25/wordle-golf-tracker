-- Simple query to see user names with their scores submitted today
SELECT 
  p.display_name,
  s.raw_score,
  s.attempts,
  s.puzzle_number,
  s.puzzle_date,
  s.submitted_at,
  g.name as group_name
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_date = CURRENT_DATE
ORDER BY s.submitted_at DESC; 