# Wordle Golf Tracker - Project Context

**Last Updated:** June 24, 2025  
**Current Status:** Production Ready & Live with Active Users  
**Deployment:** Vercel with GitHub integration  

## 🏌️ Project Overview

A Next.js application that transforms daily Wordle results into a golf-style scoring system with USGA-compliant handicap calculations. Users compete in groups with proper golf terminology and leaderboards.

### Core Concept
- **1 attempt = Hole in One (-3)**
- **2 attempts = Eagle (-2)**  
- **3 attempts = Birdie (-1)**
- **4 attempts = Par (0)**
- **5 attempts = Bogey (+1)**
- **6 attempts = Double Bogey (+2)**
- **Failed/7 attempts = Triple Bogey (+3)**

## 🏗️ Technical Architecture

### Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS with custom HSL color variables

### Database Schema (Key Tables)
```sql
-- Core user profiles
profiles (id, email, display_name, avatar_url, created_at)

-- Group management  
groups (id, name, description, code, created_by, created_at)
group_memberships (user_id, group_id, role, joined_at)

-- Score tracking with puzzle numbers
scores (
  id, user_id, group_id, 
  puzzle_date, puzzle_number, attempts, 
  golf_score, raw_score, submitted_by_admin,
  tournament_id, submitted_at
)

-- USGA handicap system
handicaps (user_id, group_id, current_handicap, games_played, last_updated)

-- Tournament support
tournaments (id, name, tournament_type, year, start_date, end_date, venue, birthday_user_id, birthday_advantage)
```

### Key Files & Structure
```
lib/
├── wordle-utils.ts          # Puzzle number calculation (PST timezone)
├── golf-scoring.ts          # USGA handicap & scoring logic
├── auth.ts                  # Supabase authentication
└── scores.ts                # Score submission utilities

app/
├── golf/
│   ├── [groupId]/
│   │   ├── leaderboard/     # Group leaderboards
│   │   ├── submit/          # Score submission
│   │   └── admin/           # Group admin functions
│   ├── clubhouse/admin/     # Global admin (manual score entry)
│   └── profile/             # User profiles & stats
├── components/ui/           # Reusable UI components
└── layout.tsx               # Global layout with navigation
```

## 🎯 Current State & Recent Fixes

### Critical Issues Recently Resolved

#### 1. Puzzle Number Synchronization (June 24, 2025)
**Problem:** App was showing puzzle #1469 when it should show #1466  
**Root Cause:** Incorrect base date calculation (June 23 vs June 24, 2025)  
**Solution:** Fixed `lib/wordle-utils.ts` to use June 24, 2025 = puzzle #1466  
**Status:** ✅ Fixed & Deployed

```typescript
// Current puzzle calculation (PST timezone)
export function getTodaysPuzzleNumber(): number {
  const baseDate = new Date('2025-06-24T00:00:00-08:00'); // PST
  const basePuzzleNumber = 1466;
  // Updates daily at midnight PST
}
```

#### 2. Today's Scores Display Issues  
**Problem:** Only showing 5 scores, using UTC dates, showing wrong players  
**Root Cause:** Mixed date/puzzle number logic, arbitrary limits  
**Solution:** Changed to filter by `puzzle_number` instead of dates  
**Status:** ✅ Fixed & Deployed

#### 3. Admin Score Entry Access  
**Problem:** 403 errors when admins tried to manually add scores  
**Root Cause:** Missing group_id and RLS policy conflicts  
**Solution:** Enhanced admin form with proper database fields  
**Status:** ✅ Fixed & Deployed

### Database Corrections Made
- Manually updated incorrect puzzle numbers (1467→1465, 1468→1466)
- All existing scores now align with corrected puzzle calculation
- Zero disruption to existing users

## 🏆 Feature Inventory

### ✅ Implemented & Working
- **User Authentication** (Supabase Auth with email/password)
- **Group Management** (Create/join groups with 6-digit codes)
- **Score Submission** (Daily Wordle → Golf score conversion)
- **USGA Handicap System** (3+ games minimum, graduated scale)
- **Multiple Leaderboards:**
  - All-time (total golf scores)
  - Monthly (current month averages) 
  - Today's Scores (current puzzle number)
- **Admin Functions:**
  - Manual score entry (Clubhouse Admin)
  - Group management (Group Admin)
- **Profile System** (User stats, score history, handicap tracking)
- **Responsive Design** (Mobile-first, modern UI)

### 🔧 Key Business Logic

#### Puzzle Number System
- **Timezone:** Pacific Standard Time (PST) - `America/Los_Angeles`
- **Reset Time:** Midnight PST daily
- **Current:** June 24, 2025 = Puzzle #1466
- **Calculation:** Centralized in `lib/wordle-utils.ts`

#### USGA Handicap Calculation
- **Minimum:** 3 games before handicap appears
- **Scale:**
  - 3-5 games: Best 2 scores
  - 6-9 games: Best 3 scores  
  - 10-14 games: Best 4 scores
  - 15-19 games: Best 6 scores
  - 20+ games: Best 8 scores
- **Formula:** `(average of best scores × 0.96)` rounded to 1 decimal
- **Implementation:** Database function `get_all_time_leaderboard()`

#### Score Conversion
```typescript
// Par = 4 attempts, golf_score = raw_score - 4
1 attempt → golf_score: -3 (Hole in One)
2 attempts → golf_score: -2 (Eagle)  
3 attempts → golf_score: -1 (Birdie)
4 attempts → golf_score: 0 (Par)
5 attempts → golf_score: +1 (Bogey)
6 attempts → golf_score: +2 (Double Bogey)
7+ attempts → golf_score: +3 (Triple Bogey)
```

## 🚀 Deployment & Operations

### GitHub Integration
- **Repository:** Connected to Vercel
- **Branch:** `main` (auto-deploy)
- **API Deploy URL:** `https://api.vercel.com/v1/integrations/deploy/prj_4OTYAp6okAkvzwnJYFUUWJdWyGzy/Aj3lroDlC9`

### Recent Deployments
1. **Job ID:** `WmkXr5ZGQcn1ljSM6Wtv` - Puzzle number fix (June 24)
2. **Job ID:** `qKKwZydmz6hhVge0sZyI` - Today's Scores fix  
3. **Job ID:** `wlU5Mamk6vdagcwqs1cm` - Performance improvements

### Environment & Configuration
- **Supabase:** Production database with RLS enabled
- **Authentication:** Email/password with profile creation
- **File Storage:** Supabase storage for avatars
- **Environment Variables:** `.env.local` (not committed)

## 🐛 Known Issues & Monitoring

### Current Status: Stable ✅
- **Active Users:** Live site with daily submissions
- **Performance:** All pages loading correctly  
- **Data Integrity:** Puzzle numbers and scores aligned
- **Error Rate:** Minimal (profile page syntax errors in dev only)

### Dev Environment Notes
- **Local Port:** 3003 (to avoid conflicts)
- **Profile Page:** Has some duplicate variable errors in dev logs (doesn't affect production)
- **Build Process:** Clean builds required occasionally (`rm -rf .next`)

## 👥 User Roles & Permissions

### Standard Users
- Submit daily scores
- View leaderboards
- Join groups via codes
- Update profile information

### Group Admins  
- Submit scores for group members
- View group member management
- Access group-specific admin functions

### Global Admins (Clubhouse)
- Manual score entry across all groups
- User management capabilities
- System-wide administrative functions

## 🎯 Future Considerations

### Potential Enhancements
- **iOS Shortcuts Integration** (for easier score submission)
- **Tournament System** (major tournaments, birthday tournaments)
- **Advanced Statistics** (trends, streaks, achievements)
- **Social Features** (comments, reactions, sharing)

### Technical Debt
- **Profile Page:** Needs duplicate variable cleanup
- **Error Handling:** Could be more robust in some areas
- **Testing:** Limited automated test coverage
- **Documentation:** API documentation could be expanded

## 🔐 Security & Data

### Authentication
- **Provider:** Supabase Auth
- **Method:** Email/password with profile creation
- **Session Management:** Automatic with Supabase client

### Row Level Security (RLS)
- **Enabled:** All tables have proper RLS policies
- **User Isolation:** Users can only see/modify their own data
- **Group Access:** Proper group membership verification
- **Admin Override:** Specific policies for administrative functions

### Data Privacy
- **User Data:** Email, display name, optional avatar
- **Score Data:** Puzzle attempts and calculated golf scores  
- **Group Data:** Membership information and group codes
- **No PII:** Minimal personal information collected

## 📊 Analytics & Metrics

### Key Performance Indicators
- **Daily Active Users:** Tracked via score submissions
- **Group Engagement:** Members per group, submission rates
- **Feature Usage:** Leaderboard views, profile updates
- **Handicap Progression:** User improvement over time

### Database Performance
- **Queries:** Optimized for leaderboard calculations
- **Indexing:** Proper indexes on user_id, group_id, puzzle_date
- **Function Performance:** RPC functions for complex calculations

## 💡 Development Guidelines

### Code Standards
- **TypeScript:** Strict typing enforced
- **Component Structure:** Functional components with hooks
- **Error Handling:** Try-catch blocks with user-friendly messages
- **Responsive Design:** Mobile-first approach

### Database Patterns
- **Migrations:** Supabase migrations for schema changes
- **Functions:** PostgreSQL functions for complex calculations  
- **Triggers:** Automatic handicap updates on score submission
- **Constraints:** Data validation at database level

### Deployment Process
1. **Local Testing:** Verify changes work locally
2. **Git Commit:** Descriptive commit messages
3. **Push to Main:** Auto-triggers Vercel deployment
4. **Verification:** Check production site functionality
5. **Monitor:** Watch for any errors or issues

---

**Note:** This document should be updated after significant changes or new feature implementations to maintain accuracy for future development sessions. 