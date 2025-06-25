-- Fix Kevin and Alicia's puzzle numbers for June 25, 2025
-- Change from 1469 to 1467 (today's correct number)

UPDATE scores 
SET puzzle_number = 1467
WHERE puzzle_date = '2025-06-25' 
  AND puzzle_number = 1469
  AND user_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.display_name IN ('Kevin', 'Alicia')
  );

-- Verify the fix worked
SELECT 
  p.display_name,
  s.puzzle_number,
  s.puzzle_date,
  s.raw_score
FROM scores s
JOIN profiles p ON s.user_id = p.id
WHERE s.puzzle_date = '2025-06-25'
ORDER BY s.submitted_at DESC; 