-- Debug birthday tournament issue
-- Let's check everything step by step

-- 1. Check the tournament details
SELECT 
  'Tournament Details' as check_type,
  t.id,
  t.name,
  t.start_date,
  t.end_date,
  t.birthday_advantage,
  t.tournament_type,
  t.is_active,
  t.birthday_user_id,
  p.display_name as birthday_person
FROM tournaments t
LEFT JOIN profiles p ON t.birthday_user_id = p.id
WHERE t.tournament_type = 'birthday' 
  AND t.year = 2025;

-- 2. Check Jake's scores for this tournament week
SELECT 
  'Jake Scores' as check_type,
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
  AND p.display_name = 'Jake'
ORDER BY s.puzzle_date DESC;

-- 3. Test the leaderboard function directly
SELECT 
  'Function Results' as check_type,
  id,
  display_name,
  score,
  qualifying_score,
  weekend_score,
  advantage_applied,
  is_birthday_person
FROM get_tournament_leaderboard(
  (SELECT id FROM tournaments WHERE tournament_type = 'birthday' AND year = 2025 LIMIT 1)
);

-- 4. Manual calculation check for Jake specifically
SELECT 
  'Manual Calculation' as check_type,
  p.display_name,
  s.puzzle_date,
  s.raw_score,
  t.birthday_advantage,
  (s.raw_score - t.birthday_advantage) as calculated_score,
  EXTRACT(DOW FROM s.puzzle_date) as day_of_week,
  CASE WHEN EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4) THEN 'Should get advantage' ELSE 'No advantage' END as advantage_status
FROM scores s
JOIN profiles p ON s.user_id = p.id
JOIN tournaments t ON t.tournament_type = 'birthday' AND t.year = 2025
WHERE p.display_name = 'Jake'
  AND s.puzzle_date BETWEEN t.start_date AND t.end_date
ORDER BY s.puzzle_date; 