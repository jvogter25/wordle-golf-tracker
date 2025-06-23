-- Run this script in your Supabase SQL Editor to fix the score submission issues

-- 1. Add the new columns to scores table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' 
        AND column_name = 'puzzle_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.scores ADD COLUMN puzzle_number integer;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' 
        AND column_name = 'submitted_by_admin'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.scores ADD COLUMN submitted_by_admin boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.scores ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 2. Populate puzzle_number for existing records
UPDATE public.scores 
SET puzzle_number = (puzzle_date - DATE '2021-06-19')::integer + 1
WHERE puzzle_number IS NULL;

-- 3. Make puzzle_number NOT NULL
ALTER TABLE public.scores ALTER COLUMN puzzle_number SET NOT NULL;

-- 4. Drop the old unique constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'scores_user_id_group_id_puzzle_date_key'
        AND table_name = 'scores'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.scores DROP CONSTRAINT scores_user_id_group_id_puzzle_date_key;
    END IF;
END $$;

-- 5. Add the new unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'scores_user_id_group_id_puzzle_number_key'
        AND table_name = 'scores'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.scores ADD CONSTRAINT scores_user_id_group_id_puzzle_number_key 
        UNIQUE (user_id, group_id, puzzle_number);
    END IF;
END $$;

-- 6. Fix tournament scoring trigger for birthday advantages
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

-- 7. Add unique constraint to prevent duplicate tournament scores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'tournament_scores_tournament_id_score_id_key' 
                   AND table_name = 'tournament_scores') THEN
        ALTER TABLE public.tournament_scores 
        ADD CONSTRAINT tournament_scores_tournament_id_score_id_key 
        UNIQUE (tournament_id, score_id);
    END IF;
END $$;

-- 8. Ensure birthday tournament has correct advantage value (should be 2.0 for -2 stroke advantage)
UPDATE public.tournaments 
SET birthday_advantage = 2.0 
WHERE tournament_type = 'birthday' 
AND birthday_advantage != 2.0; 