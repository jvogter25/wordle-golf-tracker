-- Fix raw_score data in the database
-- The raw_score should equal attempts (the actual number of attempts 1-7)
-- Some records have incorrect raw_score values due to legacy scoring logic

-- First, let's see what we have before fixing
SELECT 
  user_id,
  puzzle_date,
  attempts,
  raw_score,
  golf_score,
  CASE 
    WHEN raw_score != attempts THEN 'NEEDS FIX'
    ELSE 'OK'
  END as status
FROM scores 
ORDER BY puzzle_date DESC;

-- Fix 1: Update raw_score to equal attempts for all records
UPDATE scores 
SET raw_score = attempts
WHERE raw_score != attempts;

-- Fix 2: Update golf_score to be consistent text descriptions
UPDATE scores 
SET golf_score = CASE 
  WHEN attempts = 1 THEN 'Hole-in-One'
  WHEN attempts = 2 THEN 'Eagle'
  WHEN attempts = 3 THEN 'Birdie'
  WHEN attempts = 4 THEN 'Par'
  WHEN attempts = 5 THEN 'Bogey'
  WHEN attempts = 6 THEN 'Double Bogey'
  WHEN attempts = 7 THEN 'Failed'
  ELSE 'Unknown'
END;

-- Verify the fixes
SELECT 
  user_id,
  puzzle_date,
  attempts,
  raw_score,
  golf_score,
  CASE 
    WHEN raw_score = attempts THEN 'FIXED'
    ELSE 'STILL BROKEN'
  END as status
FROM scores 
ORDER BY puzzle_date DESC;

-- Show summary by user after fix
SELECT 
  p.display_name,
  COUNT(*) as total_games,
  SUM(s.raw_score) as total_raw_score,
  SUM(s.raw_score - 4) as total_golf_score_relative_to_par,
  ROUND(AVG(s.raw_score::numeric), 2) as avg_attempts
FROM scores s
JOIN profiles p ON s.user_id = p.id
GROUP BY p.display_name
ORDER BY total_golf_score_relative_to_par ASC; 