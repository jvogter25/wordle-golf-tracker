-- Fix existing birthday tournaments to have -2.0 advantage instead of +2.0
UPDATE tournaments 
SET birthday_advantage = -2.0 
WHERE tournament_type = 'birthday' 
AND birthday_advantage = 2.0;

-- Verify the changes
SELECT id, name, tournament_type, birthday_advantage, birthday_user_id 
FROM tournaments 
WHERE tournament_type = 'birthday'; 