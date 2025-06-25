-- Test the timezone issue causing puzzle number problems
-- Check what dates/times the database sees vs what your app calculates

-- 1. Show current UTC time and PST time
SELECT 
  NOW() as utc_now,
  NOW() AT TIME ZONE 'America/Los_Angeles' as pst_now,
  (NOW() AT TIME ZONE 'America/Los_Angeles')::date as pst_date;

-- 2. Show what puzzle_date was stored for scores today
SELECT DISTINCT 
  puzzle_date,
  COUNT(*) as score_count
FROM scores 
WHERE puzzle_date >= '2025-06-24'
GROUP BY puzzle_date
ORDER BY puzzle_date DESC;

-- 3. Check if Gari and Ilene scores are showing wrong date
SELECT 
  p.display_name,
  s.puzzle_date,
  s.submitted_at,
  s.submitted_at AT TIME ZONE 'America/Los_Angeles' as submitted_at_pst
FROM scores s
JOIN profiles p ON s.user_id = p.id
WHERE p.display_name IN ('Gari', 'Ilene')
  AND s.puzzle_date >= '2025-06-24'
ORDER BY s.submitted_at DESC; 