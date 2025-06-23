-- Fix existing birthday tournaments that are missing group_id
-- This script will find birthday tournaments without group_id and associate them with the birthday user's group

-- First, let's see what we're working with
SELECT 
  t.id,
  t.name,
  t.birthday_user_id,
  t.group_id,
  p.display_name,
  p.email
FROM tournaments t
LEFT JOIN profiles p ON t.birthday_user_id = p.id
WHERE t.tournament_type = 'birthday' 
  AND t.group_id IS NULL;

-- Update birthday tournaments to have the correct group_id
-- This finds the user's first group and assigns the tournament to it
UPDATE tournaments 
SET group_id = (
  SELECT gm.group_id 
  FROM group_members gm 
  WHERE gm.user_id = tournaments.birthday_user_id 
  LIMIT 1
)
WHERE tournament_type = 'birthday' 
  AND group_id IS NULL
  AND birthday_user_id IS NOT NULL;

-- Verify the fix worked
SELECT 
  t.id,
  t.name,
  t.birthday_user_id,
  t.group_id,
  g.name as group_name,
  p.display_name,
  t.start_date,
  t.end_date,
  t.is_active
FROM tournaments t
LEFT JOIN profiles p ON t.birthday_user_id = p.id
LEFT JOIN groups g ON t.group_id = g.id
WHERE t.tournament_type = 'birthday' 
  AND t.year = 2025
ORDER BY t.start_date; 