-- Migration script to add puzzle_number and submitted_by_admin columns to scores table

-- Add the new columns
ALTER TABLE public.scores 
ADD COLUMN IF NOT EXISTS puzzle_number integer,
ADD COLUMN IF NOT EXISTS submitted_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Populate puzzle_number for existing records based on puzzle_date
-- Wordle started on June 19, 2021 as puzzle #1
UPDATE public.scores 
SET puzzle_number = (
  EXTRACT(EPOCH FROM (puzzle_date - DATE '2021-06-19')) / 86400
)::integer + 1
WHERE puzzle_number IS NULL;

-- Make puzzle_number NOT NULL after populating
ALTER TABLE public.scores ALTER COLUMN puzzle_number SET NOT NULL;

-- Drop the old unique constraint and add new one
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_user_id_group_id_puzzle_date_key;
ALTER TABLE public.scores ADD CONSTRAINT scores_user_id_group_id_puzzle_number_key UNIQUE (user_id, group_id, puzzle_number);

-- Update the tournament scoring trigger to handle the new structure
CREATE OR REPLACE FUNCTION public.handle_tournament_score_submission()
RETURNS trigger AS $$
DECLARE
  active_tournament record;
  tournament_day integer;
  tournament_score numeric(4,1);
  advantage numeric(3,1);
BEGIN
  -- Check for active tournaments that include this date
  FOR active_tournament IN 
    SELECT * FROM public.tournaments 
    WHERE NEW.puzzle_date BETWEEN start_date AND end_date
    AND is_active = true
  LOOP
    -- Calculate tournament day (1-6, skipping Friday)
    tournament_day := CASE 
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 1 THEN 1 -- Monday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 2 THEN 2 -- Tuesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 3 THEN 3 -- Wednesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 4 THEN 4 -- Thursday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 6 THEN 5 -- Saturday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 0 THEN 6 -- Sunday
      ELSE null -- Friday - no tournament play
    END;
    
    -- Skip if this is Friday (no tournament play)
    IF tournament_day IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculate advantage if this is a birthday tournament
    advantage := 0.0;
    IF active_tournament.tournament_type = 'birthday' AND active_tournament.birthday_user_id = NEW.user_id THEN
      advantage := active_tournament.birthday_advantage;
    END IF;
    
    -- Calculate tournament score with advantage (ensure it doesn't go below 0)
    tournament_score := GREATEST(0, NEW.raw_score - advantage);
    
    -- Insert tournament score (handle duplicates in case of updates)
    INSERT INTO public.tournament_scores (
      tournament_id, score_id, tournament_day, is_qualifying_round,
      tournament_score, actual_score, advantage_applied
    ) VALUES (
      active_tournament.id, NEW.id, tournament_day, tournament_day <= 4,
      tournament_score, NEW.raw_score, advantage
    )
    ON CONFLICT (tournament_id, score_id) DO UPDATE SET
      tournament_score = EXCLUDED.tournament_score,
      actual_score = EXCLUDED.actual_score,
      advantage_applied = EXCLUDED.advantage_applied;
    
    -- Ensure tournament participant record exists
    INSERT INTO public.tournament_participants (tournament_id, user_id, group_id)
    VALUES (active_tournament.id, NEW.user_id, NEW.group_id)
    ON CONFLICT (tournament_id, user_id, group_id) DO NOTHING;
    
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also handle updates to scores (for admin overrides)
CREATE OR REPLACE FUNCTION public.handle_tournament_score_update()
RETURNS trigger AS $$
DECLARE
  active_tournament record;
  tournament_day integer;
  tournament_score numeric(4,1);
  advantage numeric(3,1);
BEGIN
  -- Check for active tournaments that include this date
  FOR active_tournament IN 
    SELECT * FROM public.tournaments 
    WHERE NEW.puzzle_date BETWEEN start_date AND end_date
    AND is_active = true
  LOOP
    -- Calculate tournament day (1-6, skipping Friday)
    tournament_day := CASE 
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 1 THEN 1 -- Monday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 2 THEN 2 -- Tuesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 3 THEN 3 -- Wednesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 4 THEN 4 -- Thursday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 6 THEN 5 -- Saturday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 0 THEN 6 -- Sunday
      ELSE null -- Friday - no tournament play
    END;
    
    -- Skip if this is Friday (no tournament play)
    IF tournament_day IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculate advantage if this is a birthday tournament
    advantage := 0.0;
    IF active_tournament.tournament_type = 'birthday' AND active_tournament.birthday_user_id = NEW.user_id THEN
      advantage := active_tournament.birthday_advantage;
    END IF;
    
    -- Calculate tournament score with advantage (ensure it doesn't go below 0)
    tournament_score := GREATEST(0, NEW.raw_score - advantage);
    
    -- Update tournament score
    UPDATE public.tournament_scores SET
      tournament_score = tournament_score,
      actual_score = NEW.raw_score,
      advantage_applied = advantage
    WHERE tournament_id = active_tournament.id AND score_id = NEW.id;
    
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add update trigger
DROP TRIGGER IF EXISTS handle_tournament_scores_update ON public.scores;
CREATE TRIGGER handle_tournament_scores_update
  AFTER UPDATE ON public.scores
  FOR EACH ROW EXECUTE PROCEDURE public.handle_tournament_score_update();

-- Add unique constraint to tournament_scores to prevent duplicates
ALTER TABLE public.tournament_scores 
ADD CONSTRAINT IF NOT EXISTS tournament_scores_tournament_id_score_id_key 
UNIQUE (tournament_id, score_id); 