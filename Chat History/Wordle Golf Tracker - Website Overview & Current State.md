# Wordle Golf Tracker - Website Overview & Current State

## **Project Overview**

The Wordle Golf Tracker is a web application that gamifies the daily Wordle puzzle by treating each attempt as a "golf stroke." Users compete in groups to achieve the lowest scores, with comprehensive tournament systems, leaderboards, and social features.

## **Core Concept**
- **Wordle Golf Scoring:** 1 attempt = 1 stroke, 2 attempts = 2 strokes, etc.
- **Lower scores are better** (like real golf)
- **Group-based competition** with tournaments and leaderboards
- **Social features** including profiles, avatars, and group management

---

## **Current Technical Stack**

### **Frontend**
- **Framework:** Next.js 13+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom HSL color variables
- **UI Components:** Custom components with Lucide React icons
- **State Management:** React Context (AuthContext, GroupContext)

### **Backend & Database**
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage (for avatars)
- **Real-time:** Supabase real-time subscriptions

### **Deployment**
- **Platform:** Vercel
- **Domain:** wordle-golf-tracker.vercel.app
- **Environment:** Production + Development servers

---

## **Current Database Schema**

### **Core Tables**
```sql
-- User profiles
profiles (
  id: uuid (FK to auth.users),
  display_name: text,
  avatar_url: text,
  birthday: date,
  birth_month: integer,
  birth_day: integer,
  bio: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Groups (clubs/organizations)
groups (
  id: uuid,
  name: text,
  description: text,
  invite_code: text,
  created_by: uuid,
  created_at: timestamp
)

-- Group membership
group_members (
  id: uuid,
  group_id: uuid,
  user_id: uuid,
  role: text ('admin' | 'member'),
  joined_at: timestamp
)

-- Daily scores
scores (
  id: uuid,
  user_id: uuid,
  puzzle_date: date,
  attempts: integer,
  raw_score: integer,
  group_id: uuid,
  created_at: timestamp
)

-- Tournaments
tournaments (
  id: uuid,
  name: text,
  group_id: uuid,
  start_date: date,
  end_date: date,
  type: text ('regular' | 'birthday'),
  birthday_user_id: uuid,
  created_at: timestamp
)
```

---

## **Current Features & Functionality**

### **✅ Working Features**

#### **Authentication & Profiles**
- User registration and login via Supabase Auth
- Profile management with display names and avatars
- Avatar upload (up to 5MB) with automatic resizing
- Birthday setting for tournament eligibility

#### **Group Management**
- Group creation with invite codes
- Group joining via invite codes
- Group member management
- Admin controls for group management

#### **Scoring System**
- Daily Wordle score submission
- Automatic handicap calculation using USGA-style method
- Score history and statistics
- Raw score tracking with attempts

#### **Tournaments**
- Regular tournaments with date ranges
- Birthday tournaments (automatic creation)
- Tournament leaderboards with cut lines
- Birthday user gets -0.5 strokes per day during their birthday week

#### **Leaderboards**
- All-time leaderboard with handicaps
- Group-specific leaderboards
- Today's scores display
- Player statistics and rankings

#### **Navigation & UI**
- Responsive design for mobile and desktop
- Wordle-themed color scheme and typography
- Hamburger menu navigation
- Profile avatars throughout the site

### **🔧 Current Issues Being Addressed**

#### **Multi-Group Architecture**
- **Problem:** Site assumes 1 user = 1 group
- **Solution:** Implementing group selection and context switching
- **Status:** Architecture planned, implementation in progress

#### **Profile Picture System**
- **Problem:** Hardcoded avatar paths, inconsistent display
- **Solution:** Proper avatar upload system with fallbacks
- **Status:** Partially implemented, needs completion

#### **Admin Access Control**
- **Problem:** All users have admin access
- **Solution:** Restrict admin features to specific email
- **Status:** Needs implementation

---

## **Current Page Structure**

### **Public Pages**
- `/` - Landing page with sign-in
- `/auth/login` - Login page
- `/auth/signup` - Registration page

### **Protected Pages**
- `/golf/homepage` - Main dashboard
- `/golf/clubhouse` - Group selection/management
- `/golf/leaderboard` - All-time leaderboard
- `/golf/tournaments` - Tournament listing
- `/golf/submit` - Score submission
- `/golf/profile` - User profile management (Player Card)
- `/golf/admin` - Admin center

### **Dynamic Pages**
- `/golf/tournaments/[id]` - Individual tournament view
- `/golf/player/[id]` - Individual player profile

---

## **Current User Flow**

1. **Registration:** User signs up with email and display name
2. **Group Joining:** User joins a group via invite code
3. **Daily Scoring:** User submits daily Wordle scores
4. **Competition:** User competes in tournaments and leaderboards
5. **Profile Management:** User manages profile and settings

---

## **Known Technical Debt**

### **Architecture Issues**
- Single-group assumption throughout codebase
- Hardcoded paths and references
- Inconsistent data fetching patterns

### **UI/UX Issues**
- Inconsistent avatar display
- Missing error handling in some forms
- Mobile responsiveness needs improvement in some areas

### **Data Issues**
- Birthday data stored in multiple formats
- Group member counting inaccuracies
- Score submission error messages despite successful saves

---

## **Immediate Priorities**

### **Phase 1: Multi-Group Foundation**
1. Implement group context and selection
2. Update route structure for group-specific pages
3. Fix data layer to filter by group
4. Update UI for group-aware navigation

### **Phase 2: Bug Fixes**
1. Fix profile picture system
2. Implement proper admin access control
3. Resolve birthday data inconsistencies
4. Fix score submission error handling

### **Phase 3: Polish & Optimization**
1. Improve mobile responsiveness
2. Add loading states and error boundaries
3. Optimize database queries
4. Enhance user experience flows

---

## **Future Roadmap**

### **Short Term (1-2 months)**
- Complete multi-group architecture
- Add group invitation system
- Implement group statistics and analytics
- Add tournament creation tools

### **Medium Term (3-6 months)**
- Add real-time features (live leaderboards)
- Implement push notifications
- Add social features (comments, reactions)
- Create mobile app

### **Long Term (6+ months)**
- Add premium features and monetization
- Implement advanced tournament formats
- Add integration with official Wordle
- Scale for larger user base

---

## **Development Environment**

### **Local Setup**
- Node.js 18+
- Next.js development server on port 3000
- Supabase local development setup
- Environment variables for API keys

### **Testing Strategy**
- Manual testing on development server
- User acceptance testing with real users
- Cross-browser compatibility testing
- Mobile device testing

### **Deployment Process**
- Git-based deployment via Vercel
- Automatic deployments on main branch
- Environment-specific configurations
- Database migrations via Supabase dashboard

---

## **Key Stakeholders**

- **Primary User:** Jake (jakevogt25@gmail.com) - Admin and primary tester
- **Secondary Users:** Family members and friends in test groups
- **Development:** Cursor AI assistant handling implementation
- **Infrastructure:** Supabase for backend, Vercel for hosting

This overview provides Cursor with the complete context needed to understand the current state of the Wordle Golf Tracker and continue development effectively.

