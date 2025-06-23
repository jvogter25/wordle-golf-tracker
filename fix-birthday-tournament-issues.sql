-- Fix birthday tournament issues
-- 1. Check current tournament settings
-- 2. Fix the tournament dates (should be Monday June 16 - Sunday June 22)
-- 3. Update birthday advantage if needed

-- First, let's see the current tournament details
SELECT 
  id,
  name,
  start_date,
  end_date,
  birthday_advantage,
  tournament_type,
  birthday_user_id
FROM tournaments 
WHERE tournament_type = 'birthday' 
  AND year = 2025;

-- Fix the tournament dates to be Monday June 16 - Sunday June 22
UPDATE tournaments 
SET 
  start_date = '2025-06-16',
  end_date = '2025-06-22'
WHERE tournament_type = 'birthday' 
  AND birthday_user_id = (
    SELECT id FROM profiles WHERE email LIKE '%jvogter%' OR display_name = 'Jake'
  )
  AND year = 2025;

-- Update birthday advantage to -2 strokes as requested
UPDATE tournaments 
SET birthday_advantage = 2.0
WHERE tournament_type = 'birthday' 
  AND birthday_user_id = (
    SELECT id FROM profiles WHERE email LIKE '%jvogter%' OR display_name = 'Jake'
  )
  AND year = 2025;

-- Verify the changes
SELECT 
  id,
  name,
  start_date,
  end_date,
  birthday_advantage,
  tournament_type,
  is_active
FROM tournaments 
WHERE tournament_type = 'birthday' 
  AND year = 2025; 