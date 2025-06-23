-- Add group_id column to tournaments table
-- This will allow tournaments to be associated with specific groups

-- Add the group_id column as a foreign key reference to groups table
ALTER TABLE tournaments 
ADD COLUMN group_id UUID REFERENCES groups(id);

-- Create an index on group_id for better query performance
CREATE INDEX idx_tournaments_group_id ON tournaments(group_id);

-- Show any existing tournaments that will need group_id populated
SELECT 
  id,
  name,
  tournament_type,
  birthday_user_id,
  group_id,
  start_date,
  end_date
FROM tournaments 
WHERE group_id IS NULL; 