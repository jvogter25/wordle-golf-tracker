# Major Tournament Feature Analysis

## 2025 Golf Major Tournament Schedule

Based on the official 2025 golf major championship schedule, here are the four major tournaments that would align with your Wordle Golf Tracker:

| Tournament | Dates | Venue |
|------------|-------|-------|
| **The Masters** | April 10-13, 2025 | Augusta National Golf Club, Georgia |
| **PGA Championship** | May 15-18, 2025 | Quail Hollow Golf Club, North Carolina |
| **U.S. Open** | June 12-15, 2025 | Oakmont Country Club, Pennsylvania |
| **The Open Championship** | July 17-20, 2025 | Royal Portrush Golf Club, Northern Ireland |

## Tournament Mechanics Design

### Tournament Structure
**Monday-Thursday: Qualifying Rounds**
- All group members submit their daily Wordle scores as normal
- These four scores count as "qualifying rounds" for the major tournament
- System tracks cumulative performance across the four days
- Real-time leaderboard shows current qualifying standings

**Friday: The Cut**
- After Thursday's Wordle submission deadline (PST), system calculates cut line
- Top 50% of participants advance to weekend rounds
- Cut line determined by total strokes across four qualifying days
- Tie-breaking system: better handicap index advances tied players

**Saturday-Sunday: Championship Rounds**
- Only players who made the cut can compete in weekend rounds
- Weekend scores count toward final tournament standings
- Final leaderboard combines all six days of competition
- Tournament champion determined by lowest total score across six rounds

### Tie-Breaking System
**Primary Tie-Breaker: Total Score**
- Lowest combined score across all tournament days wins

**Secondary Tie-Breaker: Weekend Performance**
- If tied on total score, best weekend performance (Sat + Sun) wins

**Tertiary Tie-Breaker: Current Handicap Index**
- If still tied, player with lower handicap index wins (better golfer)

**Final Tie-Breaker: Most Recent Week Performance**
- If handicaps are identical, best average score from week prior to tournament

### Tournament Scoring
**Qualifying Cut Calculation:**
```javascript
// Example with 10 players
const qualifyingScores = [
  {player: "Alice", total: 8, handicap: 2.1},
  {player: "Bob", total: 10, handicap: 3.2},
  {player: "Carol", total: 12, handicap: 4.1},
  // ... etc
];

const cutLine = Math.ceil(qualifyingScores.length * 0.5); // Top 50%
const qualifiers = qualifyingScores
  .sort((a, b) => a.total - b.total || a.handicap - b.handicap)
  .slice(0, cutLine);
```

## Database Schema Extensions

### Tournament Tables
```sql
-- Major tournaments configuration
CREATE TABLE major_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "The Masters", "PGA Championship", etc.
  year INTEGER NOT NULL,
  start_date DATE NOT NULL, -- Monday of tournament week
  end_date DATE NOT NULL,   -- Sunday of tournament week
  venue TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament participants and results
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES major_tournaments(id),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  qualifying_total INTEGER, -- Sum of Mon-Thu scores
  made_cut BOOLEAN DEFAULT false,
  weekend_total INTEGER,    -- Sum of Sat-Sun scores (if made cut)
  final_total INTEGER,      -- Sum of all 6 days (if made cut)
  final_position INTEGER,   -- Tournament finish position
  prize_description TEXT,   -- "Champion", "Runner-up", "Made Cut", etc.
  UNIQUE(tournament_id, user_id, group_id)
);

-- Tournament daily scores (links to existing scores table)
CREATE TABLE tournament_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES major_tournaments(id),
  score_id UUID REFERENCES scores(id),
  tournament_day INTEGER NOT NULL, -- 1-6 (Mon-Sun, no Friday)
  is_qualifying_round BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tournament Management Functions
```javascript
// Automatic tournament creation
async function createMajorTournaments(year) {
  const tournaments = [
    {name: "The Masters", start: `${year}-04-07`, venue: "Augusta National"},
    {name: "PGA Championship", start: `${year}-05-12`, venue: "Quail Hollow"},
    {name: "U.S. Open", start: `${year}-06-09`, venue: "Oakmont Country Club"},
    {name: "The Open Championship", start: `${year}-07-14`, venue: "Royal Portrush"}
  ];
  
  for (const tournament of tournaments) {
    await supabase.from('major_tournaments').insert({
      name: tournament.name,
      year: year,
      start_date: tournament.start,
      end_date: addDays(tournament.start, 6), // Monday to Sunday
      venue: tournament.venue
    });
  }
}

// Cut line calculation (runs Friday morning PST)
async function calculateCutLine(tournamentId, groupId) {
  const qualifyingScores = await supabase
    .from('tournament_participants')
    .select('*, users(display_name, handicap_index)')
    .eq('tournament_id', tournamentId)
    .eq('group_id', groupId)
    .order('qualifying_total', { ascending: true });
  
  const cutLine = Math.ceil(qualifyingScores.length * 0.5);
  const qualifiers = qualifyingScores.slice(0, cutLine);
  
  // Update made_cut status
  for (const qualifier of qualifiers) {
    await supabase
      .from('tournament_participants')
      .update({ made_cut: true })
      .eq('id', qualifier.id);
  }
  
  return qualifiers;
}
```

## User Experience Design

### Tournament Announcement
**Two Weeks Before Tournament:**
- App displays upcoming major tournament banner
- Shows tournament dates and venue information
- Explains tournament format and cut system

**Tournament Week:**
- Special tournament leaderboard replaces regular monthly leaderboard
- Real-time qualifying standings with cut line projection
- Daily progress indicators and tournament-specific messaging

**Cut Day (Friday):**
- Morning announcement of who made the cut
- Congratulatory messages for qualifiers
- Encouragement for those who missed the cut

**Championship Weekend:**
- Live tournament leaderboard with final standings
- Real-time position changes as weekend scores come in
- Championship celebration for tournament winner

### Tournament Notifications
```javascript
// Tournament milestone notifications
const tournamentNotifications = {
  twoWeeksOut: "🏆 The Masters Tournament starts in 2 weeks! Get ready for major championship competition.",
  mondayStart: "⛳ The Masters Tournament begins today! Your next 4 Wordle scores will determine if you make the cut.",
  cutAnnouncement: "✂️ The cut has been made! {playerName} and {otherCount} others advance to championship weekend.",
  championshipStart: "🏌️ Championship weekend begins! Only the top players compete for the major title.",
  tournamentComplete: "🏆 Congratulations to {championName}, winner of The Masters Tournament!"
};
```

## Integration with Existing Architecture

### Minimal Code Changes Required
The tournament feature integrates seamlessly with your existing architecture:

**Database:** Add tournament tables alongside existing schema
**API:** Extend existing score submission endpoints to check for active tournaments
**Frontend:** Add tournament views that overlay on existing leaderboard components
**Real-time:** Use existing Supabase subscriptions for live tournament updates

### Tournament Activation System
```javascript
// Automatic tournament detection
async function checkActiveTournament(gameDate) {
  const activeTournament = await supabase
    .from('major_tournaments')
    .select('*')
    .lte('start_date', gameDate)
    .gte('end_date', gameDate)
    .eq('is_active', true)
    .single();
  
  return activeTournament;
}

// Enhanced score submission
async function submitScore(userId, groupId, wordleResult) {
  // Normal score processing
  const score = await processWordleScore(userId, groupId, wordleResult);
  
  // Check for active tournament
  const tournament = await checkActiveTournament(score.game_date);
  if (tournament) {
    await addToTournament(tournament.id, score);
  }
  
  return score;
}
```

## Tournament Feature Benefits

### Enhanced Engagement
- **Seasonal Excitement:** Four major events per year create anticipation and special occasions
- **Competitive Drama:** Cut system adds tension and stakes to daily Wordle performance
- **Achievement Recognition:** Tournament winners and participants get special recognition
- **Family Bonding:** Major tournaments become family events to follow together

### Authentic Golf Experience
- **Real Tournament Dates:** Aligns with actual golf major championships
- **Professional Format:** Mimics real golf tournament structure with qualifying and cuts
- **Familiar Venues:** Uses actual golf course names for authenticity
- **Traditional Scoring:** Maintains golf terminology and handicap system

### Technical Simplicity
- **Minimal Complexity:** Builds on existing score tracking infrastructure
- **Automated Management:** Tournaments run automatically based on calendar dates
- **Scalable Design:** Works for small family groups or larger communities
- **Optional Participation:** Regular monthly competition continues alongside tournaments

This tournament feature transforms your family Wordle competition into something truly special four times per year, creating memorable moments and adding professional golf authenticity to your scoring system.

