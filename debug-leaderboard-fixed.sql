-- Debug Today's Leaderboard - Find missing users
-- Run each query separately to debug the issue

-- Query 1: All scores submitted today
SELECT 
  s.id as score_id,
  p.display_name,
  s.user_id,
  s.group_id,
  g.name as group_name,
  s.raw_score,
  s.attempts,
  s.puzzle_number,
  s.puzzle_date,
  s.submitted_at
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_date = CURRENT_DATE
ORDER BY s.submitted_at DESC;

-- Query 2: Today's puzzle number calculation
SELECT 1466 + EXTRACT(DAY FROM (CURRENT_DATE - DATE '2025-06-24'))::integer as todays_puzzle_number;

-- Query 3: Scores matching today's puzzle number (what leaderboard shows)
SELECT 
  s.user_id,
  s.raw_score,
  s.puzzle_number,
  p.display_name,
  s.group_id,
  g.name as group_name
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_number = (
  SELECT 1466 + EXTRACT(DAY FROM (CURRENT_DATE - DATE '2025-06-24'))::integer
)
ORDER BY s.raw_score ASC;

-- Query 4: Check for puzzle number mismatches
SELECT 
  p.display_name,
  s.puzzle_date,
  s.puzzle_number,
  (1466 + EXTRACT(DAY FROM (s.puzzle_date - DATE '2025-06-24'))::integer) as expected_puzzle_number,
  CASE 
    WHEN s.puzzle_number = (1466 + EXTRACT(DAY FROM (s.puzzle_date - DATE '2025-06-24'))::integer) 
    THEN 'MATCH' 
    ELSE 'MISMATCH' 
  END as status
FROM scores s
JOIN profiles p ON s.user_id = p.id
WHERE s.puzzle_date = CURRENT_DATE; 