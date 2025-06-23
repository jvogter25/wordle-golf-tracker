I set my birthday again but it's still not showing up

---

**Cursor**

Let me help you troubleshoot this. Let me check what might be going wrong with the birthday tournament creation process.

Let me check if the birthday tournament creation is being triggered properly when you save your birthday:

Great! I can see that the profile save function is correctly calling `checkAndCreateBirthdayTournaments` when a birthday is saved. Let me check if there's an issue with the tournament creation logic itself:

I found the issue! The problem is in the `checkAndCreateBirthdayTournaments` function. It's only looking for birthdays that are "within the next week" from today, but your birthday might not be in that narrow window. Let me also check if there are any existing tournaments that might have been created but then disappeared.

Let me create a simple script to check what's happening with your birthday data and tournaments:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xneavnttdgrpltmmldit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZWF2bnR0ZGdycGx0bW1sZGl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1OTc4OSwiZXhwIjoyMDY1MjM1Nzg5fQ.WXnwPcLF_vGKF1cOAe_eLj9lT6FKZHSzqHZkpOkNTSk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBirthdayIssue() {
  console.log('🔍 Debugging birthday tournament issue...\n');

  try {
    // 1. Check your profile data
    console.log('1. Checking profile data...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, birthday, birth_month, birth_day')
      .limit(10);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    console.log('📋 Profile data:');
    profiles.forEach(profile => {
      console.log(`  - ${profile.display_name || profile.email}: birthday=${profile.birthday}, month=${profile.birth_month}, day=${profile.birth_day}`);
    });

    // 2. Check existing tournaments
    console.log('\n2. Checking existing tournaments...');
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tournament_type', 'birthday')
      .order('created_at', { ascending: false });

    if (tournamentError) {
      console.error('❌ Error fetching tournaments:', tournamentError);
      return;
    }

    console.log(`🏆 Found ${tournaments.length} birthday tournaments:`);
    tournaments.forEach(tournament => {
      console.log(`  - ${tournament.name}: ${tournament.start_date} to ${tournament.end_date}, active=${tournament.is_active}, user_id=${tournament.birthday_user_id}`);
    });

    // 3. Test birthday tournament creation logic
    console.log('\n3. Testing birthday tournament creation logic...');
    const today = new Date();
    console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
    
    // Get profiles with birthdays
    const profilesWithBirthdays = profiles.filter(p => p.birth_month && p.birth_day);
    console.log(`👥 Profiles with birthdays: ${profilesWithBirthdays.length}`);
    
    for (const profile of profilesWithBirthdays) {
      const birthdayThisYear = new Date(today.getFullYear(), profile.birth_month - 1, profile.birth_day);
      const daysDiff = Math.floor((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`  - ${profile.display_name}: birthday ${profile.birth_month}/${profile.birth_day} (${birthdayThisYear.toISOString().split('T')[0]}) is ${daysDiff} days away`);
      
      // Check if they should have a tournament
      if (Math.abs(daysDiff) <= 7) { // Within a week either direction
        console.log(`    🎂 Should have tournament! Checking if exists...`);
        
        const existingTournament = tournaments.find(t => 
          t.birthday_user_id === profile.id && 
          t.year === today.getFullYear()
        );
        
        if (existingTournament) {
          console.log(`    ✅ Tournament exists: ${existingTournament.name}`);
        } else {
          console.log(`    ❌ No tournament found - should create one!`);
          
          // Try to create the tournament
          try {
            const weekStart = getWeekStart(birthdayThisYear);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const tournamentName = `${profile.display_name || profile.email.split('@')[0]}'s Birthday Tournament`;
            
            console.log(`    🔨 Creating tournament: ${tournamentName} (${formatDate(weekStart)} to ${formatDate(weekEnd)})`);
            
            const { data: newTournament, error: createError } = await supabase
              .from('tournaments')
              .insert({
                name: tournamentName,
                tournament_type: 'birthday',
                year: today.getFullYear(),
                start_date: formatDate(weekStart),
                end_date: formatDate(weekEnd),
                venue: 'Wordle Golf',
                is_active: true,
                birthday_user_id: profile.id,
                birthday_advantage: 0.5
              })
              .select()
              .single();
              
            if (createError) {
              console.error(`    ❌ Failed to create tournament:`, createError);
            } else {
              console.log(`    ✅ Tournament created successfully:`, newTournament.name);
            }
          } catch (error) {
            console.error(`    ❌ Error creating tournament:`, error);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

debugBirthdayIssue();
```

---

**User**

Can you change it to just ask for the month and date of user birthdays and look that way for birthdays within the next week? We're going to have an age range split of about 60 years between our oldest and youngest users and having the birth year could complicate things unecessarily

---

**Cursor**

Let me fix the main issue first. I can see that the problem is in the `checkAndCreateBirthdayTournaments` function - it's only looking for birthdays "within the next week" but it should be more flexible. Let me update it to create tournaments for birthdays that are coming up or recently passed:

```typescript
// Check for upcoming birthdays and create tournaments automatically
export async function checkAndCreateBirthdayTournaments(client: SupabaseClient) {
  const today = new Date()
  
  // Get all users with birthdays
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, display_name, email, birth_month, birth_day')
    .not('birth_month', 'is', null)
    .not('birth_day', 'is', null)

  if (profilesError) throw profilesError

  const birthdaysToProcess = profiles.filter(profile => {
    if (!profile.birth_month || !profile.birth_day) return false
    
    // Create birthday date for this year
    const birthdayThisYear = new Date(today.getFullYear(), profile.birth_month - 1, profile.birth_day)
    
    // Check if birthday is within 2 weeks (before or after today)
    // This gives us a wider window to catch birthdays
    const daysDiff = Math.floor((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.abs(daysDiff) <= 14 // Within 2 weeks either direction
  })

  console.log(`Found ${birthdaysToProcess.length} birthdays to process`)

  // Create tournaments for these birthdays
  const results = []
  for (const profile of birthdaysToProcess) {
    try {
      const tournament = await createBirthdayTournamentForUser(client, profile)
      if (tournament) {
        results.push({ success: true, tournament, profile })
        console.log(`Created tournament for ${profile.display_name}`)
      } else {
        results.push({ success: true, message: 'Tournament already exists', profile })
      }
    } catch (error) {
      results.push({ success: false, error, profile })
      console.error(`Failed to create tournament for ${profile.display_name}:`, error)
    }
  }

  return results
}
```

Now let me also update the `createBirthdayTournamentForUser` function to return `null` when a tournament already exists, so we can handle that case properly:

```typescript
async function createBirthdayTournamentForUser(client: SupabaseClient, profile: any) {
  const today = new Date()
  const birthdayDate = new Date(today.getFullYear(), profile.birth_month - 1, profile.birth_day)
  
  // Check if tournament already exists for this user's birthday this year
  const { data: existingTournament } = await client
    .from('tournaments')
    .select('id')
    .eq('tournament_type', 'birthday')
    .eq('birthday_user_id', profile.id)
    .eq('year', today.getFullYear())
    .single()

  if (existingTournament) {
    console.log(`Tournament already exists for ${profile.display_name}`)
    return null // Tournament already exists
  }

  // Create the birthday tournament
  const tournamentName = `${profile.display_name || profile.email.split('@')[0]}'s Birthday Tournament`
  
  // Tournament runs for the week of their birthday (Monday to Sunday)
  const weekStart = getWeekStart(birthdayDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  console.log(`Creating birthday tournament for ${profile.display_name}: ${formatDate(weekStart)} to ${formatDate(weekEnd)}`)

  const { data: tournament, error } = await client
    .from('tournaments')
    .insert({
      name: tournamentName,
      tournament_type: 'birthday',
      year: today.getFullYear(),
      start_date: formatDate(weekStart),
      end_date: formatDate(weekEnd),
      venue: 'Wordle Golf',

