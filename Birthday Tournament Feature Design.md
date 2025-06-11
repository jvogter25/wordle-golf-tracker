# Birthday Tournament Feature Design

## Tournament Calendar Overview

Your Wordle Golf Tracker would now feature two distinct tournament types creating year-round excitement:

### Major Tournaments (4 per year)
- **The Masters** (April 10-13, 2025)
- **PGA Championship** (May 15-18, 2025) 
- **U.S. Open** (June 12-15, 2025)
- **The Open Championship** (July 17-20, 2025)

### Birthday Tournaments (Variable per year)
- **Personal Celebrations**: One tournament per family member's birthday week
- **Birthday Advantage**: Honoree receives 0.5 stroke advantage throughout tournament
- **Custom Theming**: Tournament named after birthday person with personalized elements

## Birthday Tournament Mechanics

### Tournament Structure
**Monday-Thursday: Birthday Qualifying Rounds**
- Tournament runs during the week containing the family member's birthday
- All group members participate in daily Wordle as normal
- Birthday person receives automatic 0.5 stroke deduction from each daily score
- Qualifying cut line remains at 50% of participants

**Friday: Birthday Cut Day**
- Cut calculation includes birthday person's stroke advantage
- Birthday advantage continues through weekend if they make the cut
- Special birthday-themed cut announcement

**Saturday-Sunday: Birthday Championship Weekend**
- Birthday person maintains 0.5 stroke advantage
- Tournament winner receives special birthday-themed recognition
- If birthday person wins, extra celebration messaging

### Birthday Advantage Implementation
```javascript
// Birthday stroke advantage calculation
function applyBirthdayAdvantage(score, userId, tournamentId) {
  const tournament = getTournament(tournamentId);
  
  if (tournament.type === 'birthday' && tournament.birthday_user_id === userId) {
    return Math.max(0, score - 0.5); // Minimum score of 0
  }
  
  return score;
}

// Example scoring with birthday advantage
const normalScore = 4; // Par
const birthdayScore = 4 - 0.5 = 3.5; // Becomes a birdie equivalent
```

### Tournament Naming and Theming
**Tournament Names:**
- "Alice's Birthday Classic"
- "Bob's Birthday Championship" 
- "Carol's Birthday Invitational"
- "Dad's Birthday Open"

**Personalized Elements:**
- Birthday person's profile photo featured prominently
- Custom tournament description mentioning their age/milestone
- Special birthday-themed leaderboard colors
- Personalized congratulatory messages

## Database Schema Extensions

### Birthday Tournament Tables
```sql
-- Extended tournament types
ALTER TABLE major_tournaments 
ADD COLUMN tournament_type VARCHAR(20) DEFAULT 'major' CHECK (tournament_type IN ('major', 'birthday'));

ADD COLUMN birthday_user_id UUID REFERENCES users(id); -- NULL for major tournaments
ADD COLUMN birthday_advantage DECIMAL(3,1) DEFAULT 0.0; -- 0.5 for birthday tournaments

-- User birthday information
ALTER TABLE users 
ADD COLUMN birth_date DATE; -- Store birthday (year optional for privacy)
ADD COLUMN birth_month INTEGER CHECK (birth_month BETWEEN 1 AND 12);
ADD COLUMN birth_day INTEGER CHECK (birth_day BETWEEN 1 AND 31);

-- Birthday tournament preferences
CREATE TABLE birthday_tournament_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  enable_birthday_tournaments BOOLEAN DEFAULT true,
  custom_tournament_name TEXT, -- "Alice's Amazing Tournament"
  preferred_week_offset INTEGER DEFAULT 0, -- 0 = week of birthday, -1 = week before, etc.
  UNIQUE(user_id, group_id)
);
```

### Automatic Birthday Tournament Creation
```javascript
// Generate birthday tournaments for the year
async function createBirthdayTournaments(groupId, year) {
  const groupMembers = await supabase
    .from('group_memberships')
    .select('users(id, display_name, birth_month, birth_day)')
    .eq('group_id', groupId);
  
  for (const member of groupMembers) {
    const user = member.users;
    if (!user.birth_month || !user.birth_day) continue;
    
    // Calculate tournament week (week containing birthday)
    const birthdayDate = new Date(year, user.birth_month - 1, user.birth_day);
    const tournamentStart = getWeekStart(birthdayDate); // Monday of birthday week
    
    // Avoid conflicts with major tournaments
    const hasConflict = await checkMajorTournamentConflict(tournamentStart);
    if (hasConflict) {
      tournamentStart = findAlternativeWeek(birthdayDate);
    }
    
    await supabase.from('major_tournaments').insert({
      name: `${user.display_name}'s Birthday Championship`,
      tournament_type: 'birthday',
      birthday_user_id: user.id,
      birthday_advantage: 0.5,
      year: year,
      start_date: tournamentStart,
      end_date: addDays(tournamentStart, 6),
      venue: `${user.display_name}'s Home Course`
    });
  }
}

// Handle birthday tournament conflicts
async function checkMajorTournamentConflict(proposedDate) {
  const conflicts = await supabase
    .from('major_tournaments')
    .select('*')
    .eq('tournament_type', 'major')
    .lte('start_date', addDays(proposedDate, 6))
    .gte('end_date', proposedDate);
  
  return conflicts.length > 0;
}

function findAlternativeWeek(birthdayDate) {
  // Try week before, then week after birthday
  const weekBefore = addDays(getWeekStart(birthdayDate), -7);
  const weekAfter = addDays(getWeekStart(birthdayDate), 7);
  
  // Return first available week (additional conflict checking needed)
  return weekBefore; // Simplified logic
}
```

## User Experience Design

### Birthday Tournament Announcement
**Two Weeks Before Birthday:**
```
🎂 Alice's Birthday Championship starts in 2 weeks! 
Get ready to celebrate Alice's special week with tournament competition.
Birthday advantage: Alice gets 0.5 strokes off each round!
```

**Tournament Week:**
```
🎉 Happy Birthday Week, Alice! 
Your Birthday Championship is now active. You're playing with a 0.5 stroke advantage all week.
Current tournament standings: [Live Leaderboard]
```

**Birthday Day During Tournament:**
```
🎂🏆 Happy Birthday, Alice! 
Today's your special day and you're leading your own tournament! 
Make it a birthday to remember with a great Wordle score.
```

### Birthday Tournament Leaderboard
```
🎂 Alice's Birthday Championship
April 15-21, 2025 | Alice's Home Course

QUALIFYING LEADERBOARD (Through Thursday)
1. Alice*        8.0 strokes  (8.5 actual - 0.5 birthday bonus)
2. Bob          10.0 strokes
3. Carol        11.0 strokes
4. Dad          12.0 strokes

*Birthday advantage applied
Cut line: Top 2 advance to weekend
```

### Birthday Celebration Features
**If Birthday Person Wins:**
```
🏆🎂 BIRTHDAY CHAMPION! 🎂🏆
Alice wins her own Birthday Championship! 
What a perfect way to celebrate another year around the sun.
Final Score: 15.5 strokes (16.0 actual - 0.5 birthday bonus)
```

**If Birthday Person Doesn't Win:**
```
🎂 Happy Birthday, Alice! 
While Bob took home the tournament trophy, you're still the champion of the day.
Thanks for letting us celebrate your special week with this tournament!
```

## Tournament Calendar Management

### Annual Tournament Schedule
```javascript
// Generate full year tournament calendar
async function generateAnnualTournaments(groupId, year) {
  // Create major tournaments
  await createMajorTournaments(year);
  
  // Create birthday tournaments
  await createBirthdayTournaments(groupId, year);
  
  // Resolve any scheduling conflicts
  await resolveSchedulingConflicts(groupId, year);
  
  return await getAnnualTournamentCalendar(groupId, year);
}

// Example tournament calendar for a family of 4
const exampleCalendar = [
  {date: "2025-02-10", type: "birthday", name: "Dad's Birthday Championship"},
  {date: "2025-04-10", type: "major", name: "The Masters"},
  {date: "2025-04-28", type: "birthday", name: "Alice's Birthday Championship"},
  {date: "2025-05-15", type: "major", name: "PGA Championship"},
  {date: "2025-06-12", type: "major", name: "U.S. Open"},
  {date: "2025-07-17", type: "major", name: "The Open Championship"},
  {date: "2025-08-11", type: "birthday", name: "Bob's Birthday Championship"},
  {date: "2025-11-04", type: "birthday", name: "Carol's Birthday Championship"}
];
```

### Conflict Resolution Strategy
**Major Tournament Priority:**
- Major tournaments take precedence over birthday tournaments
- Birthday tournaments automatically shift to adjacent weeks if conflicts occur
- Users receive notification about schedule adjustments

**Birthday Conflict Resolution:**
- If multiple birthdays fall in same week, combine into "Birthday Week Championship"
- Both birthday people receive 0.5 stroke advantage
- Tournament named "Alice & Bob's Birthday Championship"

**Scheduling Preferences:**
```sql
-- User preferences for birthday tournament timing
CREATE TABLE birthday_scheduling_preferences (
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  preferred_timing VARCHAR(20) DEFAULT 'birthday_week', -- 'birthday_week', 'week_before', 'week_after'
  allow_major_conflicts BOOLEAN DEFAULT false,
  enable_combined_birthdays BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, group_id)
);
```

## Family Engagement Features

### Birthday Tournament Traditions
**Pre-Tournament Rituals:**
- Birthday person chooses tournament "course conditions" message
- Special birthday-themed Wordle strategy tips
- Family predictions for tournament outcome

**During Tournament:**
- Daily birthday wishes integrated with score submissions
- Birthday person gets to write daily tournament updates
- Special birthday emojis and themes throughout the week

**Post-Tournament Celebration:**
- Tournament recap highlighting birthday person's performance
- Photo sharing capabilities for birthday celebration
- Tournament "trophy" graphic featuring birthday person

### Personalization Options
```javascript
// Birthday tournament customization
const birthdayCustomization = {
  tournamentName: "Alice's Amazing Adventure", // Custom name
  courseDescription: "Alice's Favorite Thinking Spot", // Personal venue
  welcomeMessage: "Let's celebrate Alice's love of word puzzles!", // Personal message
  advantageAmount: 0.5, // Configurable advantage (0.25, 0.5, 0.75)
  themeColor: "#FF69B4", // Birthday person's favorite color
  celebrationEmoji: "🎂🏆🎉" // Custom emoji set
};
```

## Integration with Existing Features

### Handicap System Interaction
**Birthday Advantage Application:**
- 0.5 stroke advantage applied before handicap calculations
- Birthday scores with advantage still count toward long-term handicap
- Separate tracking of "actual" vs "tournament" scores for fairness

**Handicap Calculation Example:**
```javascript
// Birthday tournament score processing
function processBirthdayScore(rawScore, isBirthdayPerson) {
  const tournamentScore = isBirthdayPerson ? rawScore - 0.5 : rawScore;
  const handicapScore = rawScore; // Use actual score for handicap calculation
  
  return {
    tournamentScore: tournamentScore,
    handicapScore: handicapScore,
    displayScore: tournamentScore,
    advantage: isBirthdayPerson ? 0.5 : 0
  };
}
```

### Monthly Leaderboard Integration
**Tournament Week Display:**
- Regular monthly leaderboard temporarily replaced by tournament leaderboard
- Tournament scores still count toward monthly competition
- Clear indication when tournament is active

**Post-Tournament Integration:**
- Tournament results highlighted in monthly summary
- Birthday tournament winners get special monthly recognition
- Tournament performance affects monthly handicap calculations

## Technical Implementation Considerations

### Database Performance
**Tournament Query Optimization:**
```sql
-- Efficient tournament lookup
CREATE INDEX idx_tournaments_active ON major_tournaments(start_date, end_date, tournament_type) 
WHERE is_active = true;

-- Birthday tournament queries
CREATE INDEX idx_birthday_tournaments ON major_tournaments(birthday_user_id, tournament_type)
WHERE tournament_type = 'birthday';
```

### Real-Time Updates
**Birthday Tournament Notifications:**
```javascript
// Real-time birthday tournament updates
const birthdayTournamentSubscription = supabase
  .channel('birthday-tournaments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tournament_scores',
    filter: 'tournament_type=eq.birthday'
  }, (payload) => {
    updateBirthdayLeaderboard(payload.new);
    sendBirthdayTournamentNotification(payload.new);
  })
  .subscribe();
```

### Privacy Considerations
**Birthday Information:**
- Users can opt to share only month/day without year
- Birthday tournaments can be disabled per user preference
- Private birthday celebrations vs. group tournaments

This birthday tournament feature creates a perfect complement to the major tournaments, ensuring every family member gets their special week of celebration while maintaining the competitive golf atmosphere throughout the year.

