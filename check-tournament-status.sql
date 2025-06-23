-- Check tournament status and scores
-- Let's see what's happening with the birthday tournament

-- 1. Check the tournament details
SELECT 
  t.id,
  t.name,
  t.start_date,
  t.end_date,
  t.birthday_advantage,
  t.tournament_type,
  t.is_active,
  p.display_name as birthday_person
FROM tournaments t
LEFT JOIN profiles p ON t.birthday_user_id = p.id
WHERE t.tournament_type = 'birthday' 
  AND t.year = 2025;

-- 2. Check if there are any scores submitted for this tournament period
SELECT 
  s.id,
  s.user_id,
  s.puzzle_date,
  s.raw_score,
  s.attempts,
  p.display_name,
  EXTRACT(DOW FROM s.puzzle_date) as day_of_week,
  CASE 
    WHEN EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4) THEN 'Qualifying Day'
    WHEN EXTRACT(DOW FROM s.puzzle_date) IN (5,6,0) THEN 'Championship Day'
    ELSE 'Rest Day'
  END as tournament_day_type
FROM scores s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.puzzle_date BETWEEN '2025-06-16' AND '2025-06-22'
ORDER BY s.puzzle_date DESC, p.display_name;

-- 3. Check what the birthday advantage should be for Jake
SELECT 
  t.birthday_advantage,
  t.birthday_user_id,
  p.display_name
FROM tournaments t
LEFT JOIN profiles p ON t.birthday_user_id = p.id
WHERE t.tournament_type = 'birthday' 
  AND t.year = 2025
  AND p.display_name = 'Jake'; 