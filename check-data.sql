-- Simple check of what data exists

-- Check profiles
SELECT display_name, id FROM profiles ORDER BY display_name;

-- Check scores with both raw_score and golf_score
SELECT 
  p.display_name,
  s.raw_score,
  s.golf_score,
  s.attempts,
  s.puzzle_date,
  g.name as group_name
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
ORDER BY s.puzzle_date DESC, p.display_name
LIMIT 20; 