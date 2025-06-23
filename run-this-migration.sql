-- Run this script in your Supabase SQL Editor to fix the score submission issues

-- 1. Add the new columns to scores table
ALTER TABLE public.scores 
ADD COLUMN IF NOT EXISTS puzzle_number integer,
ADD COLUMN IF NOT EXISTS submitted_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Populate puzzle_number for existing records
UPDATE public.scores 
SET puzzle_number = (
  EXTRACT(EPOCH FROM (puzzle_date - DATE '2021-06-19')) / 86400
)::integer + 1
WHERE puzzle_number IS NULL;

-- 3. Make puzzle_number NOT NULL
ALTER TABLE public.scores ALTER COLUMN puzzle_number SET NOT NULL;

-- 4. Update constraints
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_user_id_group_id_puzzle_date_key;
ALTER TABLE public.scores ADD CONSTRAINT scores_user_id_group_id_puzzle_number_key UNIQUE (user_id, group_id, puzzle_number);

-- 5. Fix tournament scoring trigger for birthday advantages
CREATE OR REPLACE FUNCTION public.handle_tournament_score_submission()
RETURNS trigger AS $$
DECLARE
  active_tournament record;
  tournament_day integer;
  tournament_score numeric(4,1);
  advantage numeric(3,1);
BEGIN
  FOR active_tournament IN 
    SELECT * FROM public.tournaments 
    WHERE NEW.puzzle_date BETWEEN start_date AND end_date
    AND is_active = true
  LOOP
    tournament_day := CASE 
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 1 THEN 1 -- Monday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 2 THEN 2 -- Tuesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 3 THEN 3 -- Wednesday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 4 THEN 4 -- Thursday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 6 THEN 5 -- Saturday
      WHEN EXTRACT(dow FROM NEW.puzzle_date) = 0 THEN 6 -- Sunday
      ELSE null
    END;
    
    IF tournament_day IS NULL THEN
      CONTINUE;
    END IF;
    
    advantage := 0.0;
    IF active_tournament.tournament_type = 'birthday' AND active_tournament.birthday_user_id = NEW.user_id THEN
      advantage := active_tournament.birthday_advantage;
    END IF;
    
    tournament_score := GREATEST(0, NEW.raw_score - advantage);
    
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
    
    INSERT INTO public.tournament_participants (tournament_id, user_id, group_id)
    VALUES (active_tournament.id, NEW.user_id, NEW.group_id)
    ON CONFLICT (tournament_id, user_id, group_id) DO NOTHING;
    
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add unique constraint to prevent duplicate tournament scores
ALTER TABLE public.tournament_scores 
ADD CONSTRAINT IF NOT EXISTS tournament_scores_tournament_id_score_id_key 
UNIQUE (tournament_id, score_id); 