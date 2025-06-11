# Wordle Golf Tracker - Family Project Architecture

## Launch Features (MVP)

### User Authentication & Group Management
**Simple email-only authentication with private family group creation for competitive Wordle tracking.** This feature eliminates password complexity while maintaining security through email verification, enabling families to create private leaderboards for friendly competition.

* Email-based user registration without password requirements
* Magic link login system for frictionless access
* Private group creation with customizable names
* Group invitation via email or shareable links
* Basic group membership management
* Privacy controls ensuring scores are only visible within groups

#### Tech Involved
* Supabase Authentication with magic link email providers
* Row Level Security (RLS) for group-based data isolation
* React Native with NativeWind for cross-platform UI
* JWT token management for session persistence

#### Main Requirements
* Email verification for account security
* Group-based data privacy enforcement
* Simple invitation and joining workflow
* Cross-platform authentication state management

### USGA-Style Golf Scoring System
**Golf handicap calculation system based on official USGA methodology adapted for Wordle's six-attempt format.** This system converts Wordle attempts into familiar golf terminology and calculates fair handicaps using recent performance, ensuring competitive balance between family members of different skill levels.

* Automatic conversion: 2=eagle, 3=birdie, 4=par, 5=bogey, 6=double bogey, failed=triple bogey
* USGA-compliant handicap calculation using best scores from recent games
* Minimum 3 games required for initial handicap calculation
* Progressive scoring: uses more scores as history builds (up to best 8 of 20)
* All puzzles treated equally regardless of perceived difficulty
* Real-time handicap updates after each score submission

#### Tech Involved
* PostgreSQL database with optimized scoring tables
* Node.js handicap calculation service following USGA rules
* Real-time score processing and validation
* Automated handicap recalculation triggers

#### Main Requirements
* Accurate USGA handicap algorithm implementation
* Daily-only score submission (current day's Wordle only)
* Pacific Standard Time as the universal time reference
* Historical data retention for handicap calculations

### Monthly Leaderboards
**Dynamic monthly leaderboards showing current standings with both raw scores and handicap-adjusted rankings.** Family members can view their position within groups, track monthly progress, and access historical leaderboard data with real-time updates as scores are submitted throughout the month.

* Current month leaderboard with live score updates
* Handicap-adjusted rankings for fair family competition
* Raw score leaderboards for absolute performance bragging rights
* Historical month navigation and archives
* Individual performance trends and statistics
* Group average comparisons and benchmarks

#### Tech Involved
* Supabase real-time subscriptions for live leaderboard updates
* Optimized database queries with proper indexing
* React Native components with responsive design
* Efficient caching for frequently accessed leaderboard data

#### Main Requirements
* Real-time updates across all connected devices
* Fast query performance for leaderboard generation
* Historical data access with month-based filtering
* Mobile-responsive leaderboard display

### Individual Profile & Statistics
**Personal dashboard displaying comprehensive Wordle performance analytics and customizable profile information.** Family members can upload profile pictures, view detailed statistics, analyze performance patterns, and track improvement over time with clear visual representations.

* Customizable profile with photo upload capability
* Personal handicap display and progression tracking
* Detailed statistics: average scores, best performances, solving patterns
* Performance trend analysis with visual charts
* Comparison against group averages
* Personal achievement tracking and milestones

#### Tech Involved
* Supabase Storage for profile image management
* Chart visualization libraries for performance trends
* React Native dashboard with NativeWind styling
* Image optimization and CDN delivery

#### Main Requirements
* Secure profile image upload and storage
* Comprehensive statistical calculations
* Interactive performance visualizations
* Privacy controls for profile information

### iOS Shortcuts Integration
**Automated score submission through iOS Shortcuts for frictionless daily score entry.** This feature parses Wordle results from the clipboard and submits scores automatically, eliminating manual data entry while ensuring only current-day submissions are accepted.

* Clipboard-based Wordle result parsing
* Automatic score validation and format checking
* Current-day-only submission enforcement
* One-tap submission to user's groups
* Success confirmation and error messaging

#### Tech Involved
* iOS Shortcuts with HTTP request capabilities
* RESTful API endpoints for score submission
* Date validation using Pacific Standard Time
* JSON payload formatting and authentication

#### Main Requirements
* Robust Wordle result parsing algorithms
* Strict current-day submission validation
* Secure API authentication for shortcuts
* Clear error messaging for invalid submissions

## Future Features (Post-MVP)

### Engagement Features
* Streak tracking and consistency rewards for daily participation
* Achievement system with family-friendly badges and milestones
* Seasonal challenges and special family events
* Performance improvement celebrations and encouragement

#### Tech Involved
* Streak calculation algorithms
* Achievement tracking systems
* Notification services for milestones
* Gamification engines for family engagement

#### Main Requirements
* Fair and encouraging reward systems
* Family-appropriate achievement categories
* Positive reinforcement for consistent participation

### Enhanced Analytics
* Performance prediction based on solving patterns
* Family member comparison analytics
* Seasonal performance trends and insights
* Solving strategy pattern recognition

#### Tech Involved
* Statistical analysis algorithms
* Data visualization libraries
* Trend analysis and pattern recognition
* Comparative analytics engines

#### Main Requirements
* Privacy-compliant family analytics
* Encouraging rather than competitive insights
* Simple and understandable performance metrics

## System Diagram

![System Architecture](https://private-us-east-1.manuscdn.com/sessionFile/jecXtBhSAFQ19b8TQEMyPS/sandbox/CYTpphUDGMjvG2MWl8kf0e-images_1749604821648_na1fn_L2hvbWUvdWJ1bnR1L3VwZGF0ZWRfc3lzdGVtX2FyY2hpdGVjdHVyZQ.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvamVjWHRCaFNBRlExOWI4VFFFTXlQUy9zYW5kYm94L0NZVHBwaFVER01qdkcyTVdsOGtmMGUtaW1hZ2VzXzE3NDk2MDQ4MjE2NDhfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzVndaR0YwWldSZmMzbHpkR1Z0WDJGeVkyaHBkR1ZqZEhWeVpRLnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc2NzIyNTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ZFNfCuNEHR0ERqElRVGyQLqtc4wa8oJDTmAbZf9a7gVEq8nsqH1AxRE5EaOQ1PlS16tdzOvvg9cTMY5fNQv~ihWAiB~3E4KOh4sxtRYLg4Qwe6E12SrQvrtyPtfJyWifv~5SmWINtmdlumhc6ZkXo8Mj2GdAbjTKwKh0QpP2F9yGRTAXeX2vN7C7ka6r8OQwK-cVZy7df7pOMbeDFbVUX-tYsE8PK-gVTaSo6SFmIKml4rsNlKN6EiMKPhHJeFjKeGIlunjUGlWMnVQJSFgtwF67kBAg9dbNqHDaZ5rWWcfiLw-QWxL2KB-eHIDJrSuO37SKpTl7cRV67aa-JwhxGw__)

The system architecture is designed for simplicity and family use, starting with 10-15 users and focusing on reliability over complexity. React Native with NativeWind provides a consistent experience across devices while deploying easily to web via Vercel. Supabase handles all backend services including authentication, database, and real-time features. The USGA handicap calculation runs as serverless functions, ensuring fair competition within family groups.

## Backup and Recovery Strategy

### For Small Family Groups (10-15 Users)
* **Supabase Automatic Backups**: Daily backups included in free tier, stored for 7 days
* **Manual Export Capability**: Periodic CSV exports of score data for local backup
* **Simple Recovery Process**: Restore from Supabase backups or manual imports
* **Data Redundancy**: Supabase provides built-in redundancy and reliability

### Recommended Backup Schedule
* **Weekly**: Manual export of score data to local storage
* **Monthly**: Full database backup verification
* **Before Updates**: Complete backup before any system changes

#### Tech Involved
* Supabase built-in backup systems
* Simple CSV export functionality
* Local file storage for manual backups
* Automated backup verification scripts

#### Main Requirements
* Minimal maintenance overhead for family project
* Simple recovery procedures that don't require technical expertise
* Cost-effective backup solutions within free tier limits

## Implementation Priorities

### Phase 1: Core Family Features (Weeks 1-4)
1. User authentication and group creation
2. Basic score entry and storage
3. Simple leaderboard display
4. USGA handicap calculation

### Phase 2: Enhanced Experience (Weeks 5-8)
1. Profile pages and statistics
2. Historical leaderboard access
3. Real-time updates and notifications
4. iOS Shortcuts integration

### Phase 3: Polish and Refinement (Weeks 9-12)
1. Performance optimization
2. Mobile responsiveness improvements
3. Error handling and edge cases
4. Family user testing and feedback

## Questions & Clarifications

* Should the app send any notifications (email or push) for daily reminders or when family members submit scores?
* Would you like to include any fun family-specific features like custom group names, family photos, or personalized messages?
* Should there be any role distinctions within groups (like a family admin) or keep everyone equal?
* Would you prefer a simple manual score entry interface or focus primarily on the iOS Shortcuts automation?
* Should the app display any encouraging messages or celebrations when family members achieve personal bests?

## List of Architecture Consideration Questions

* How should the system handle family members who join mid-month - should their handicap calculation start immediately or wait for the next month?
* Should there be any limits on group size to maintain the family-focused experience?
* How can the app encourage daily participation without being pushy or creating pressure?
* Should the system track and display family participation rates or keep it purely individual?
* What happens if multiple family members want to use the same email address - should this be allowed or restricted?
* How should the app handle family members who want to leave a group - should their historical data remain or be removed?
* Should there be any way for family groups to "reset" their competition (clear scores) for special occasions or new seasons?
* How can the architecture ensure the app remains fun and lighthearted rather than overly competitive?
* Should the system support multiple family groups per user (for extended family, friends, etc.) or keep it simple with one group per person?
* How should the app handle technical issues or bugs that might affect scoring fairness within family groups?

