-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  birth_month integer check (birth_month between 1 and 12),
  birth_day integer check (birth_day between 1 and 31),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create groups table
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete cascade not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Create scores table
create table public.scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  puzzle_date date not null,
  attempts integer not null check (attempts >= 1 and attempts <= 7),
  golf_score text not null,
  raw_score integer not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id, puzzle_date)
);

-- Create handicaps table
create table public.handicaps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  current_handicap numeric(4,1) default 0 not null,
  games_played integer default 0 not null,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

-- Create tournaments table (supports both major and birthday tournaments)
create table public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  tournament_type text check (tournament_type in ('major', 'birthday')) not null,
  year integer not null,
  start_date date not null,
  end_date date not null,
  venue text not null,
  is_active boolean default false,
  birthday_user_id uuid references public.profiles(id) on delete cascade, -- null for major tournaments
  birthday_advantage numeric(3,1) default 0.0, -- 0.5 for birthday tournaments
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tournament participants table
create table public.tournament_participants (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  qualifying_total numeric(4,1), -- sum of mon-thu scores (with advantages applied)
  made_cut boolean default false,
  weekend_total numeric(4,1), -- sum of sat-sun scores (with advantages applied)
  final_total numeric(4,1), -- sum of all 6 days (with advantages applied)
  final_position integer, -- tournament finish position
  prize_description text, -- "Champion", "Runner-up", "Made Cut", etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tournament_id, user_id, group_id)
);

-- Create tournament scores table (links scores to tournaments)
create table public.tournament_scores (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  score_id uuid references public.scores(id) on delete cascade not null,
  tournament_day integer not null check (tournament_day between 1 and 6), -- 1-4 qualifying, 5-6 championship
  is_qualifying_round boolean not null,
  tournament_score numeric(4,1) not null, -- score with any advantages applied
  actual_score integer not null, -- original raw score
  advantage_applied numeric(3,1) default 0.0, -- advantage amount applied
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create birthday tournament preferences table
create table public.birthday_tournament_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  enable_birthday_tournaments boolean default true,
  custom_tournament_name text, -- custom name like "Alice's Amazing Tournament"
  preferred_week_offset integer default 0, -- 0 = week of birthday, -1 = week before, etc.
  preferred_advantage numeric(3,1) default 0.5 check (preferred_advantage between 0.0 and 1.0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

-- Create indexes for better performance
create index idx_scores_user_group_date on public.scores(user_id, group_id, puzzle_date);
create index idx_scores_group_date on public.scores(group_id, puzzle_date desc);
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_handicaps_user_group on public.handicaps(user_id, group_id);
create index idx_tournaments_active on public.tournaments(start_date, end_date, tournament_type, is_active);
create index idx_tournaments_birthday on public.tournaments(birthday_user_id, tournament_type) where tournament_type = 'birthday';
create index idx_tournament_participants_tournament on public.tournament_participants(tournament_id);
create index idx_tournament_scores_tournament on public.tournament_scores(tournament_id, tournament_day);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.scores enable row level security;
alter table public.handicaps enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_scores enable row level security;
alter table public.birthday_tournament_preferences enable row level security;

-- Profiles RLS policies
create policy "Users can view their own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users can view profiles of group members" on public.profiles
  for select using (
    id in (
      select gm.user_id 
      from public.group_members gm
      where gm.group_id in (
        select gm2.group_id 
        from public.group_members gm2 
        where gm2.user_id = auth.uid()
      )
    )
  );

-- Groups RLS policies
create policy "Users can view groups they belong to" on public.groups
  for select using (
    id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can create groups" on public.groups
  for insert with check (created_by = auth.uid());

create policy "Group admins can update groups" on public.groups
  for update using (
    id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Group members RLS policies
create policy "Users can view group members for their groups" on public.group_members
  for select using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can join groups" on public.group_members
  for insert with check (user_id = auth.uid());

create policy "Users can leave groups" on public.group_members
  for delete using (user_id = auth.uid());

create policy "Group admins can manage members" on public.group_members
  for all using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Scores RLS policies
create policy "Users can view scores in their groups" on public.scores
  for select using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can submit their own scores" on public.scores
  for insert with check (
    user_id = auth.uid() and
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can update their own scores" on public.scores
  for update using (user_id = auth.uid());

-- Handicaps RLS policies
create policy "Users can view handicaps in their groups" on public.handicaps
  for select using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can manage their own handicaps" on public.handicaps
  for all using (user_id = auth.uid());

-- Tournament RLS policies
create policy "Users can view tournaments for their groups" on public.tournaments
  for select using (true); -- tournaments are public information

create policy "Admins can manage tournaments" on public.tournaments
  for all using (
    exists (
      select 1 from public.group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Tournament participants RLS policies
create policy "Users can view tournament participants in their groups" on public.tournament_participants
  for select using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can manage their own tournament participation" on public.tournament_participants
  for all using (user_id = auth.uid());

-- Tournament scores RLS policies
create policy "Users can view tournament scores in their groups" on public.tournament_scores
  for select using (
    tournament_id in (
      select t.id from public.tournaments t
      join public.tournament_participants tp on t.id = tp.tournament_id
      where tp.group_id in (
        select group_id 
        from public.group_members 
        where user_id = auth.uid()
      )
    )
  );

-- Birthday preferences RLS policies
create policy "Users can manage their own birthday preferences" on public.birthday_tournament_preferences
  for all using (user_id = auth.uid());

create policy "Users can view birthday preferences in their groups" on public.birthday_tournament_preferences
  for select using (
    group_id in (
      select group_id 
      from public.group_members 
      where user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- Function to automatically update handicaps when scores are submitted
create or replace function public.update_handicap_on_score_insert()
returns trigger as $$
begin
  -- Update or insert handicap
  insert into public.handicaps (user_id, group_id, current_handicap, games_played, last_updated)
  values (
    new.user_id,
    new.group_id,
    0, -- Will be calculated by the application
    1,
    timezone('utc'::text, now())
  )
  on conflict (user_id, group_id)
  do update set
    games_played = handicaps.games_played + 1,
    last_updated = timezone('utc'::text, now());
    
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update handicaps on score submission
create trigger update_handicap_on_score
  after insert on public.scores
  for each row execute procedure public.update_handicap_on_score_insert();

-- Function to check for active tournaments and add scores automatically
create or replace function public.handle_tournament_score_submission()
returns trigger as $$
declare
  active_tournament record;
  tournament_day integer;
  tournament_score numeric(4,1);
  advantage numeric(3,1);
begin
  -- Check for active tournaments that include this date
  for active_tournament in 
    select * from public.tournaments 
    where new.puzzle_date between start_date and end_date
    and is_active = true
  loop
    -- Calculate tournament day (1-6, skipping Friday)
    tournament_day := case 
      when extract(dow from new.puzzle_date) = 1 then 1 -- Monday
      when extract(dow from new.puzzle_date) = 2 then 2 -- Tuesday
      when extract(dow from new.puzzle_date) = 3 then 3 -- Wednesday
      when extract(dow from new.puzzle_date) = 4 then 4 -- Thursday
      when extract(dow from new.puzzle_date) = 6 then 5 -- Saturday
      when extract(dow from new.puzzle_date) = 0 then 6 -- Sunday
      else null -- Friday - no tournament play
    end;
    
    -- Skip if this is Friday (no tournament play)
    if tournament_day is null then
      continue;
    end if;
    
    -- Calculate advantage if this is a birthday tournament
    advantage := 0.0;
    if active_tournament.tournament_type = 'birthday' and active_tournament.birthday_user_id = new.user_id then
      advantage := active_tournament.birthday_advantage;
    end if;
    
    -- Calculate tournament score with advantage
    tournament_score := greatest(0, new.raw_score - advantage);
    
    -- Insert tournament score
    insert into public.tournament_scores (
      tournament_id, score_id, tournament_day, is_qualifying_round,
      tournament_score, actual_score, advantage_applied
    ) values (
      active_tournament.id, new.id, tournament_day, tournament_day <= 4,
      tournament_score, new.raw_score, advantage
    );
    
    -- Ensure tournament participant record exists
    insert into public.tournament_participants (tournament_id, user_id, group_id)
    values (active_tournament.id, new.user_id, new.group_id)
    on conflict (tournament_id, user_id, group_id) do nothing;
    
  end loop;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to handle tournament score submissions
create trigger handle_tournament_scores
  after insert on public.scores
  for each row execute procedure public.handle_tournament_score_submission();

-- Function to calculate cut line for tournaments
create or replace function public.calculate_tournament_cut(tournament_id_param uuid, group_id_param uuid)
returns void as $$
declare
  cut_line integer;
  participant_record record;
begin
  -- Calculate qualifying totals for all participants
  update public.tournament_participants 
  set qualifying_total = (
    select coalesce(sum(ts.tournament_score), 0)
    from public.tournament_scores ts
    where ts.tournament_id = tournament_id_param
    and ts.score_id in (
      select s.id from public.scores s 
      where s.user_id = tournament_participants.user_id 
      and s.group_id = tournament_participants.group_id
    )
    and ts.is_qualifying_round = true
  )
  where tournament_id = tournament_id_param and group_id = group_id_param;
  
  -- Calculate cut line (top 50%)
  select ceiling(count(*) * 0.5) into cut_line
  from public.tournament_participants
  where tournament_id = tournament_id_param and group_id = group_id_param;
  
  -- Update made_cut status
  with ranked_participants as (
    select *, row_number() over (order by qualifying_total asc) as rank
    from public.tournament_participants
    where tournament_id = tournament_id_param and group_id = group_id_param
  )
  update public.tournament_participants 
  set made_cut = (rank <= cut_line)
  from ranked_participants
  where tournament_participants.id = ranked_participants.id;
  
end;
$$ language plpgsql security definer;

-- Enable realtime for tables
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.handicaps;
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.tournament_participants;
alter publication supabase_realtime add table public.tournament_scores; 