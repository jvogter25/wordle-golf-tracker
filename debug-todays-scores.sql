-- Debug script to investigate Today's Leaderboard issue
-- This script is safe and won't modify any data - just shows information

-- First, let's see all scores submitted today with user names
SELECT 
  s.id as score_id,
  p.display_name,
  p.email,
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

-- Second, let's see what the Today's Leaderboard query is actually returning
-- This matches the exact query from the leaderboard page
SELECT 
  s.user_id,
  s.raw_score,
  s.puzzle_number,
  p.id as profile_id,
  p.display_name,
  p.avatar_url,
  s.group_id,
  g.name as group_name
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_number = (
  -- Calculate today's puzzle number like the app does
  SELECT 1466 + EXTRACT(DAY FROM (CURRENT_DATE - DATE '2025-06-24'))::integer
)
ORDER BY s.raw_score ASC;

-- Third, let's check if there are any issues with the profiles table
SELECT 
  COUNT(*) as total_profiles,
  COUNT(display_name) as profiles_with_names,
  COUNT(avatar_url) as profiles_with_avatars
FROM profiles;

-- Fourth, let's see if there are any duplicate scores for the same user/group/date
SELECT 
  p.display_name,
  s.user_id,
  s.group_id,
  g.name as group_name,
  s.puzzle_date,
  COUNT(*) as score_count
FROM scores s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN groups g ON s.group_id = g.id
WHERE s.puzzle_date = CURRENT_DATE
GROUP BY p.display_name, s.user_id, s.group_id, g.name, s.puzzle_date
HAVING COUNT(*) > 1;

-- Fifth, let's check what groups exist and how many members each has
SELECT 
  g.id,
  g.name,
  COUNT(gm.user_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id, g.name
ORDER BY g.name; 