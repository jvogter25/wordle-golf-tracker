# Wordle Golf Tracker - Family Project

A React Native app that transforms your family's daily Wordle experience into an exciting golf-style competition with USGA handicap scoring, seasonal tournaments, and personalized birthday celebrations.

## Features

### Core Functionality
- **USGA Golf Scoring**: Convert Wordle attempts to authentic golf scores (Eagle, Birdie, Par, etc.)
- **Handicap System**: Fair competition with automatic USGA-style handicap calculations
- **Private Family Groups**: Secure family competitions with invite codes
- **Real-time Leaderboards**: Live monthly rankings with net and raw score options
- **Smart Score Parsing**: Automatic Wordle result detection from clipboard
- **Pacific Time Validation**: Ensures fair daily scoring windows

### Tournament System

#### Major Tournaments 🏆
Four prestigious annual tournaments matching real golf majors:
- **The Masters Tournament** (April) - Augusta National Golf Club, Georgia
- **PGA Championship** (May) - Quail Hollow Golf Club, North Carolina  
- **U.S. Open Championship** (June) - Oakmont Country Club, Pennsylvania
- **The Open Championship** (July) - Royal Portrush Golf Club, Northern Ireland

**Tournament Format:**
- **Monday-Thursday**: Qualifying rounds (all participants)
- **Friday**: Cut day - top 50% advance (no play)
- **Saturday-Sunday**: Championship rounds (qualifiers only)
- Authentic golf tournament experience with leaderboards and position tracking

#### Birthday Tournaments 🎂
Personal celebrations for each family member:
- **Birthday Week Competition**: Tournament during the week containing member's birthday
- **0.5 Stroke Advantage**: Birthday person gets automatic scoring bonus
- **Custom Tournament Names**: Personalized tournament titles
- **Flexible Scheduling**: Automatic conflict resolution with major tournaments
- **Celebration Messaging**: Special birthday-themed notifications and achievements

### User Experience
- **Profile Management**: Avatar uploads, statistics tracking, birthday preferences
- **Real-time Updates**: Live score submissions and leaderboard changes
- **iOS Shortcuts Integration**: Quick score submission from clipboard
- **Tournament Notifications**: Automated announcements for cuts, winners, and milestones
- **Mobile-First Design**: Optimized for family smartphone use

## Technical Architecture

### Frontend
- **React Native** with Expo Router for navigation
- **NativeWind** for styling (Tailwind CSS for React Native)
- **TypeScript** for type safety
- **Context API** for state management
- **Real-time subscriptions** for live updates

### Backend
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** with Row Level Security
- **Magic Link Authentication** for passwordless login
- **Automatic tournament management** with database triggers
- **USGA handicap calculations** with stored procedures

### Database Schema
```sql
-- Core tables
profiles, groups, group_members, scores, handicaps

-- Tournament system
tournaments, tournament_participants, tournament_scores, birthday_tournament_preferences

-- Features
- Automatic tournament score tracking
- Cut line calculations  
- Birthday advantage application
- Real-time leaderboard updates
```

## Getting Started

### Prerequisites
- Node.js 18 or later
- Expo CLI
- Supabase account
- iOS/Android development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wordle-golf-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Enable Row Level Security policies
   - Set up Storage bucket for profile photos
   - Configure Magic Link authentication

4. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npx expo start
   ```

### Tournament Setup

1. **Create Tournament Schedule**
   - Navigate to Tournaments tab
   - Select your group
   - Tap "Create [Year] Tournament Schedule"
   - Creates all major tournaments + birthday tournaments for group members

2. **Configure Birthday Preferences**
   - Go to Tournaments > Settings (gear icon)
   - Set your birthday date
   - Customize tournament name and timing
   - Adjust stroke advantage (0.25 - 1.0 strokes)

3. **Activate Tournaments**
   - Tournaments automatically activate on their start dates
   - Database triggers handle score tracking and advantages
   - Cut lines calculated automatically on Friday mornings

## How It Works

### Daily Workflow
1. **Complete Wordle**: Play the daily puzzle
2. **Submit Score**: Copy result or manually enter attempts
3. **Automatic Processing**: 
   - Converts to golf score
   - Updates handicap
   - Adds to active tournaments
   - Updates leaderboards

### Tournament Lifecycle
1. **Tournament Creation**: Annual schedule generated with major and birthday tournaments
2. **Activation**: Tournaments become active on start dates
3. **Qualifying**: Monday-Thursday scores determine cut line
4. **Cut Day**: Friday morning cut applied (top 50% advance)
5. **Championship**: Saturday-Sunday final rounds
6. **Results**: Final standings, positions, and recognition

### Scoring System
```
Wordle Attempts → Golf Score → Tournament Impact
1 attempt → Hole in One (-3) → Massive advantage
2 attempts → Eagle (-2) → Strong performance  
3 attempts → Birdie (-1) → Above average
4 attempts → Par (0) → Average score
5 attempts → Bogey (+1) → Below average
6 attempts → Double Bogey (+2) → Poor performance
Failed (X) → Triple Bogey (+3) → Worst outcome
```

### Birthday Advantages
- **Automatic Application**: Stroke reduction applied to all tournament rounds
- **Fair Integration**: Advantage scores still count toward long-term handicaps
- **Celebration Features**: Special messaging, leaderboard highlighting, and win recognition

## Deployment

### Mobile App Stores
1. **Build for Production**
   ```bash
   npx expo build:ios
   npx expo build:android
   ```

2. **Submit to Stores**
   - Follow Expo's store submission guides
   - Include tournament feature descriptions
   - Highlight family-friendly competition aspects

### Backend Scaling
- **Supabase Pro**: For larger family groups or multiple families
- **Database Optimization**: Indexes included for tournament queries
- **Real-time Scaling**: Supabase handles concurrent users automatically

## Family Usage Tips

### Getting Started
1. **Create Family Group**: One person creates group, others join with invite code
2. **Set Up Profiles**: Add photos, birthdays, and tournament preferences  
3. **Establish Routine**: Daily Wordle → Submit score → Check leaderboard
4. **Plan Tournaments**: Review upcoming schedule, create excitement for majors

### Tournament Strategy
- **Qualifying Rounds**: Consistency is key Monday-Thursday
- **Cut Pressure**: Make every shot count approaching Friday
- **Championship Weekend**: Go for broke when it matters most
- **Birthday Celebrations**: Enjoy your advantage and aim for glory

### Family Engagement
- **Daily Check-ins**: Review leaderboards together
- **Tournament Previews**: Discuss upcoming major tournaments
- **Birthday Celebrations**: Make tournament weeks special occasions
- **Year-end Review**: Celebrate achievements and plan next year

## Contributing

This is a family project, but suggestions and improvements are welcome! Please consider:
- **Tournament Features**: Ideas for new tournament types or formats
- **Scoring Enhancements**: Additional golf scoring options
- **Family Features**: Better ways to celebrate achievements
- **Mobile Experience**: iOS/Android-specific improvements

## License

MIT License - Feel free to adapt for your own family's Wordle competitions!

---

**Made with ❤️ for family fun and friendly competition**

## Session Configuration (48-hour sessions)

To enable 48-hour sessions, configure your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Settings** 
3. Update these settings:
   - **JWT expiry limit**: 172800 (48 hours in seconds)
   - **Refresh token rotation**: Enabled
   - **Refresh token reuse interval**: 10 (seconds)
   - **Session timeout**: 172800 (48 hours in seconds)

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub and deploy via Vercel dashboard with environment variables configured. # Trigger deployment
