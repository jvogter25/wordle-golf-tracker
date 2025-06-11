# Simplified Wordle Golf Tracker - Architecture Analysis

Based on your clarified requirements, here's a streamlined architecture analysis focused on your specific needs:

## Infrastructure Sizing for 10-15 Initial Users

### Supabase Free Tier Analysis
Your initial user base of 10-15 users fits perfectly within Supabase's generous free tier:

**Free Tier Limits:**
- 50,000 monthly active users (you need 10-15)
- 500 MB database size (more than sufficient for score data)
- 5 GB bandwidth per month (ample for your use case)
- 1 GB file storage (enough for profile pictures)
- Unlimited API requests

**Growth Projection:** Even if you grow to 100+ users in the first year, you'll likely stay within the free tier limits. The Pro tier at $25/month only becomes necessary when you exceed 50,000 monthly active users or need more database storage.

### Vercel Hosting Costs
Vercel's free tier supports:
- 100 GB bandwidth per month
- Unlimited static deployments
- Serverless function executions

Your React Native Web app will deploy as a static site, making it extremely cost-effective.

## USGA Handicap System Implementation

### Core Algorithm
Based on USGA Rules of Handicapping, your system should implement:

**Handicap Calculation:**
- Minimum 3 scores required for initial handicap
- Use best 8 scores out of most recent 20 (when available)
- For fewer than 20 scores, use proportional calculation:
  - 3-5 scores: Use lowest 1
  - 6-8 scores: Use lowest 2
  - 9-11 scores: Use lowest 3
  - 12-14 scores: Use lowest 4
  - 15-16 scores: Use lowest 5
  - 17-18 scores: Use lowest 6
  - 19 scores: Use lowest 7

**Wordle to Golf Score Conversion:**
- 2 attempts = Eagle (-2)
- 3 attempts = Birdie (-1)
- 4 attempts = Par (0)
- 5 attempts = Bogey (+1)
- 6 attempts = Double Bogey (+2)
- Failed = Triple Bogey (+3)

**Score Differential Calculation:**
For each Wordle game, calculate: `(Golf Score - 0) * 113 / 113 = Golf Score`
(Simplified since Wordle has consistent "course rating" and "slope")

### Database Schema for USGA System

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  wordle_number INTEGER NOT NULL,
  attempts INTEGER, -- 1-6, or NULL for failed
  golf_score INTEGER NOT NULL, -- -2 to +3
  score_differential DECIMAL(4,1) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_date DATE NOT NULL, -- PST date
  UNIQUE(user_id, group_id, wordle_number)
);

-- Handicap history for tracking changes
CREATE TABLE handicap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  handicap_index DECIMAL(4,1) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scores_used INTEGER NOT NULL -- number of scores used in calculation
);
```

## Simplified MVP Features

### Core Features Only
1. **Email-only authentication** (no password complexity)
2. **Simple group creation and joining**
3. **Manual score entry** (iOS Shortcuts as enhancement)
4. **Monthly leaderboards with USGA handicaps**
5. **Basic profile pages with statistics**

### Removed Complexity
- No custom scoring rules (standard golf scoring only)
- No group-specific achievements initially
- No social features beyond leaderboards
- No monetization features
- No compliance requirements
- No offline functionality
- Single timezone (PST) for all users

## Technical Implementation

### React Native Web Setup
```bash
# Install dependencies
npm install react-native-web react-dom react-scripts
npm install nativewind
npm install @supabase/supabase-js

# Configure for web deployment
npx expo export -p web
# Deploy dist folder to Vercel
```

### Handicap Calculation Service
```javascript
// Simplified USGA handicap calculation
function calculateHandicap(scores) {
  if (scores.length < 3) return null;
  
  const sortedDifferentials = scores
    .map(score => score.score_differential)
    .sort((a, b) => a - b);
  
  const numScoresToUse = getNumScoresToUse(scores.length);
  const bestScores = sortedDifferentials.slice(0, numScoresToUse);
  
  return (bestScores.reduce((sum, score) => sum + score, 0) / numScoresToUse);
}

function getNumScoresToUse(totalScores) {
  if (totalScores <= 5) return 1;
  if (totalScores <= 8) return 2;
  if (totalScores <= 11) return 3;
  if (totalScores <= 14) return 4;
  if (totalScores <= 16) return 5;
  if (totalScores <= 18) return 6;
  if (totalScores === 19) return 7;
  return 8; // 20+ scores
}
```

### PST Timezone Handling
```javascript
// Always use PST for Wordle game dates
function getWordleGameDate() {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  return pstDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}
```

## Development Workflow

### Local Development with Docker
```dockerfile
# Dockerfile for local development
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Deployment Pipeline
1. **Development:** Docker container locally
2. **Version Control:** GitHub with automatic deployments
3. **Build:** `expo export -p web` for React Native Web
4. **Deploy:** Vercel automatic deployment from GitHub
5. **Database:** Supabase hosted PostgreSQL

## Cost Projection

### Year 1 Costs (10-100 users)
- **Supabase:** $0 (free tier)
- **Vercel:** $0 (free tier)
- **Domain:** ~$12/year
- **Total:** ~$12/year

### Scaling Costs (if you reach 1000+ users)
- **Supabase Pro:** $25/month
- **Vercel Pro:** $20/month (if needed)
- **Total:** ~$540/year

Your architecture is extremely cost-effective for the initial phase and scales predictably as you grow.

## Next Steps

1. **Set up development environment** with Docker
2. **Create Supabase project** and configure database schema
3. **Initialize React Native project** with NativeWind
4. **Implement USGA handicap calculation** service
5. **Build core MVP features** in order of priority
6. **Deploy to Vercel** for testing
7. **Add iOS Shortcuts integration** as enhancement

This simplified approach removes complexity while maintaining the core competitive golf experience you want to create.

