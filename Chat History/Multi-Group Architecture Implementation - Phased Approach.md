# Multi-Group Architecture Implementation - Phased Approach

Based on the conversation between the user and Cursor about implementing proper multi-group functionality, here is the comprehensive phased approach that was outlined:

## **Current Problem Identified**
- Site assumes "1 user = 1 group" 
- When users have multiple groups, everything breaks
- Current approach is patchwork instead of proper multi-group architecture

## **Proposed Solution Architecture**
```
Base Site (bones) → Select Group → Group-Specific Experience
```

This follows common patterns used by apps like:
- Slack (workspaces)
- Discord (servers) 
- GitHub (organizations)

## **Implementation Complexity: MEDIUM (but worth it)**

**Timeline:** 2-3 hours of focused development work

---

## **PHASE 1: Group Context & Selection (30 mins)**

### **Objectives:**
- Create GroupContext to store selected group
- Build group selection page at `/golf/clubhouse`
- Store selection in localStorage

### **Key Components to Create:**

#### 1. Group Context (`contexts/GroupContext.tsx`)
```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code?: string;
  created_at: string;
}

interface GroupContextType {
  selectedGroup: Group | null;
  availableGroups: Group[];
  setSelectedGroup: (group: Group) => void;
  loading: boolean;
  refreshGroups: () => Promise<void>;
}
```

#### 2. Group Selection Page
- Replace current clubhouse with group picker
- Show available groups for user
- Allow group switching
- Store selected group in localStorage

#### 3. Navigation Updates
- Add GroupProvider to app layout
- Update header to show group name when selected
- Move "Home" button to right side near hamburger menu

### **Testing Instructions:**
- User can see all their groups
- Clicking a group selects it and stores in localStorage
- Group name appears in header
- Group selection persists on page refresh

---

## **PHASE 2: Route Structure (45 mins)**

### **Objectives:**
- Update all routes to `/golf/[groupId]/tournaments`, etc.
- Add group validation middleware
- Redirect logic for group selection

### **New Route Structure:**
```
/golf/clubhouse                    → Group selection page
/golf/[groupId]/dashboard          → Group-specific dashboard
/golf/[groupId]/leaderboard        → Group-specific leaderboard
/golf/[groupId]/tournaments        → Group-specific tournaments
/golf/[groupId]/submit             → Group-specific score submission
/golf/profile                      → Global profile (cross-group)
/golf/admin                        → Admin center
```

### **Key Updates:**
1. Create dynamic route pages with `[groupId]` parameter
2. Add group validation on each page
3. Redirect to clubhouse if no group selected
4. Update all internal navigation links

### **Testing Instructions:**
- URLs include group ID
- Pages load correctly with group context
- Invalid group IDs redirect to clubhouse
- Navigation between group pages works seamlessly

---

## **PHASE 3: Data Layer Updates (60 mins)**

### **Objectives:**
- Update all database queries to filter by groupId
- Fix tournaments, leaderboards, scores, etc.
- Ensure admin functions work per-group

### **Database Query Updates:**

#### 1. Tournaments
```sql
-- Filter tournaments by group
SELECT * FROM tournaments WHERE group_id = $1
```

#### 2. Leaderboards
```sql
-- Filter scores by group membership
SELECT * FROM scores s
JOIN group_members gm ON s.user_id = gm.user_id
WHERE gm.group_id = $1
```

#### 3. Score Submission
- Add group_id to scores table
- Filter submissions by selected group

#### 4. Admin Functions
- Group creation restricted to admin email
- Group management per-group basis

### **Testing Instructions:**
- Data shows only for selected group
- Switching groups shows different data
- Score submissions go to correct group
- Admin functions work properly

---

## **PHASE 4: UI Updates & Polish (30 mins)**

### **Objectives:**
- Group name in header on all pages
- Update navigation links
- Polish group switching flow

### **Header Layout:**
```
[Profile Pic] ← → [GROUP NAME] ← → [Home] [Hamburger Menu]
```

### **Navigation Updates:**
- Burger menu shows group-specific links when in group
- Profile page links back to group dashboard
- Consistent navigation experience

### **Testing Instructions:**
- Group name visible in header on all group pages
- Navigation flows logically between pages
- User can easily switch between groups
- UI is consistent and polished

---

## **Benefits of This Architecture:**

✅ **Clean architecture for future growth**
✅ **No more "which group?" confusion**
✅ **Easy to add family/friends/work groups later**
✅ **Each group feels like its own app**
✅ **Professional app structure**
✅ **Future-proof for scaling**

---

## **Risk Assessment: MINIMAL**

- Implementation is incremental and testable
- Each phase can be tested before proceeding
- Backup/rollback plan available via git tags
- No breaking changes to existing functionality

---

## **Additional Fixes Identified During Implementation:**

### **Phase 1.5: Critical Bug Fixes**
1. **Profile Picture Issues**
   - Fix hardcoded avatar paths
   - Implement proper avatar upload (5MB limit)
   - Default to 👤 emoji placeholder

2. **Admin Access Control**
   - Restrict admin center to `jakevogt25@gmail.com`
   - Restrict group creation to admin only

3. **Birthday Signup Issue**
   - Remove birthday prompt from signup page
   - Keep birthday setting in Player Card only

4. **UI Cleanup**
   - Remove blue debugging boxes
   - Fix missing score emojis on leaderboard
   - Fix group member count display

### **Phase 1.75: Data Integrity**
1. **Score Submission Errors**
   - Fix "Failed to submit score" error messages
   - Ensure scores save properly regardless of error display

2. **Group Member Counting**
   - Fix member count display to show accurate numbers
   - Update count dynamically as members join/leave

---

## **Implementation Notes:**

- **Backup Strategy:** Create git tag `v1.0-stable` before starting
- **Testing Strategy:** Test each phase thoroughly before proceeding
- **Rollback Plan:** `git checkout v1.0-stable` if needed
- **User Communication:** Keep user informed of progress at each phase

This phased approach transforms the site from a single-group architecture to a robust multi-group platform while maintaining all existing functionality and providing a clear path for future expansion.

