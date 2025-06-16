const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTournamentDates() {
  console.log('Fixing tournament dates...');
  
  // Get the current tournament
  const { data: tournaments, error: fetchError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('tournament_type', 'birthday');
  
  if (fetchError) {
    console.error('Error fetching tournaments:', fetchError);
    return;
  }
  
  console.log('Found tournaments:', tournaments);
  
  if (tournaments.length === 0) {
    console.log('No tournaments found');
    return;
  }
  
  // Update the tournament to this week (December 15-21, 2024)
  const tournamentId = tournaments[0].id;
  const today = new Date();
  
  // Calculate this week's Monday-Sunday
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];
  
  console.log(`Updating tournament to run from ${startDate} to ${endDate}`);
  
  const { data: updatedTournament, error: updateError } = await supabase
    .from('tournaments')
    .update({
      start_date: startDate,
      end_date: endDate,
      year: 2024,
      is_active: true
    })
    .eq('id', tournamentId)
    .select();
  
  if (updateError) {
    console.error('Error updating tournament:', updateError);
    return;
  }
  
  console.log('Tournament updated successfully:', updatedTournament);
  
  // Also create the SQL function
  console.log('Creating SQL function...');
  
  const sqlFunction = `
    CREATE OR REPLACE FUNCTION get_tournament_leaderboard(tournament_id UUID)
    RETURNS TABLE (
      id UUID,
      display_name TEXT,
      avatar_url TEXT,
      score NUMERIC,
      qualifying_score NUMERIC,
      weekend_score NUMERIC,
      advantage_applied NUMERIC,
      is_birthday_person BOOLEAN
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        p.id,
        p.display_name,
        p.avatar_url,
        -- Total tournament score (qualifying + weekend)
        COALESCE(
          CASE 
            WHEN t.tournament_type = 'birthday' AND t.birthday_user_id = p.id THEN
              -- Birthday person: advantage only on Mon-Thu, regular scoring Fri-Sun
              (SELECT 
                SUM(CASE 
                  WHEN EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4) THEN -- Mon-Thu
                    GREATEST(0, s.raw_score - t.birthday_advantage)
                  ELSE -- Fri-Sun
                    s.raw_score
                END)
               FROM scores s 
               WHERE s.user_id = p.id 
               AND s.puzzle_date BETWEEN t.start_date AND t.end_date)
            ELSE
              -- Regular scoring for everyone else
              (SELECT SUM(s.raw_score)
               FROM scores s 
               WHERE s.user_id = p.id 
               AND s.puzzle_date BETWEEN t.start_date AND t.end_date)
          END, 0
        ) as score,
        -- Qualifying score (Monday-Thursday only)
        COALESCE(
          CASE 
            WHEN t.tournament_type = 'birthday' AND t.birthday_user_id = p.id THEN
              -- Birthday person gets advantage during qualifying
              (SELECT SUM(GREATEST(0, s.raw_score - t.birthday_advantage))
               FROM scores s 
               WHERE s.user_id = p.id 
               AND s.puzzle_date BETWEEN t.start_date AND t.end_date
               AND EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4)) -- Mon-Thu
            ELSE
              -- Regular qualifying scoring
              (SELECT SUM(s.raw_score)
               FROM scores s 
               WHERE s.user_id = p.id 
               AND s.puzzle_date BETWEEN t.start_date AND t.end_date
               AND EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4)) -- Mon-Thu
          END, 0
        ) as qualifying_score,
        -- Weekend score (Friday-Sunday, no advantages for anyone)
        COALESCE(
          (SELECT SUM(s.raw_score)
           FROM scores s 
           WHERE s.user_id = p.id 
           AND s.puzzle_date BETWEEN t.start_date AND t.end_date
           AND EXTRACT(DOW FROM s.puzzle_date) IN (5,6,0)), 0 -- Fri-Sun
        ) as weekend_score,
        -- Advantage applied (only during qualifying rounds)
        CASE 
          WHEN t.tournament_type = 'birthday' AND t.birthday_user_id = p.id THEN
            COALESCE(t.birthday_advantage * 
              (SELECT COUNT(*)
               FROM scores s 
               WHERE s.user_id = p.id 
               AND s.puzzle_date BETWEEN t.start_date AND t.end_date
               AND EXTRACT(DOW FROM s.puzzle_date) IN (1,2,3,4)), 0) -- Only Mon-Thu
          ELSE 0
        END as advantage_applied,
        (t.tournament_type = 'birthday' AND t.birthday_user_id = p.id) as is_birthday_person
      FROM tournaments t
      CROSS JOIN profiles p
      WHERE t.id = tournament_id
      AND EXISTS (
        -- Only include players who have submitted at least one score during the tournament
        SELECT 1 FROM scores s 
        WHERE s.user_id = p.id 
        AND s.puzzle_date BETWEEN t.start_date AND t.end_date
      )
      ORDER BY score ASC, p.display_name ASC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlFunction });
  
  if (sqlError) {
    console.error('Error creating SQL function:', sqlError);
    // Try alternative method
    console.log('Trying alternative SQL execution...');
    const { error: altError } = await supabase
      .from('_sql_functions')
      .insert({ function_sql: sqlFunction });
    
    if (altError) {
      console.error('Alternative SQL execution also failed:', altError);
    }
  } else {
    console.log('SQL function created successfully');
  }
}

fixTournamentDates().catch(console.error); 