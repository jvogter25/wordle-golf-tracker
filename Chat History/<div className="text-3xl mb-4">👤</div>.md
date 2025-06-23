                <div className="text-3xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Player Card</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Manage your profile</p>
              </Link>
```

Perfect! I've changed the display name from "Profile" to "Player Card" in the dashboard quick actions section. The functionality remains exactly the same - it still links to `/golf/profile` and maintains all the profile management features, but now displays as "Player Card" as requested.

---

**User**

It still says "Profile" in the wordle typeface and "Profile" in the drop down menu - can you update those too?

---

**Cursor**

I'll find and update those other locations where "Profile" appears. Let me search for them:

Now let me check for the dropdown menu where "Profile" appears:

Perfect! I found both locations. Let me update them:

1. First, the Wordle header in the profile page:

```typescriptreact
        <WordleHeader label="PROFILE" />

->

        <WordleHeader label="PLAYER CARD" />
```

```typescriptreact
// ... existing code ...
        <WordleHeader label="PLAYER CARD" />
// ... existing code ...
```

Let me find the exact line and update it:

I see that the header is already changed to "PLAYER CARD"! Now I need to update all the dropdown menu labels. Let me update them:

```typescriptreact
const menuItems = [
  { href: `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
];
```

```typescriptreact
const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
  { href: () => '/golf/admin', label: 'Admin Center' },
];
```

```typescriptreact
const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
  { href: () => '/golf/admin', label: 'Admin Center' },
];
```

```typescriptreact
const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
  { href: () => '/golf/admin', label: 'Admin Center' },
];
```

```typescriptreact
const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
  { href: () => '/golf/admin', label: 'Admin Center' },
];
```

```typescriptreact
const groupMenuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
  { href: '/golf/admin', label: 'Admin Center' },
];

const globalMenuItems = [
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
  { href: '/golf/admin', label: 'Admin Center' },
];
```

I need to fix the linter error by properly handling the group-aware links. Let me correct this:

```typescriptreact
function BurgerMenu({ selectedGroup }: { selectedGroup: any }) {
  const [open, setOpen] = useState(false);
  
  const groupAwareLinks = selectedGroup ? [
    { href: `/golf/${selectedGroup.id}/dashboard`, label: 'Dashboard' },
    { href: `/golf/${selectedGroup.id}/leaderboard`, label: 'Leaderboard' },
    { href: `/golf/${selectedGroup.id}/tournaments`, label: 'Tournaments' },
    { href: `/golf/${selectedGroup.id}/submit`, label: 'Submit Score' },
    { href: '/golf/profile', label: 'Player Card' },
    { href: '/golf/clubhouse', label: 'Clubhouse' },
    { href: '/golf/admin', label: 'Admin Center' },
  ] : globalMenuItems;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition"
      >
        <Menu size={24} className="text-[hsl(var(--foreground))]" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 flex flex-col">
          {groupAwareLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-3 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition first:rounded-t-lg last:rounded-b-lg"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

Now let me clean up the unused constants:

```typescriptreact
const globalMenuItems = [
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
  { href: '/golf/admin', label: 'Admin Center' },
];
```

Let me check what's currently in the file and clean it up:

Perfect! Now I've successfully updated all the locations where "Profile" appeared:

1. ✅ **Dashboard quick action card**: Changed from "Profile" to "Player Card"
2. ✅ **Wordle header**: Changed from "PROFILE" to "PLAYER CARD" 
3. ✅ **All dropdown menus**: Changed all the burger menu items from "Profile" to "Player Card" across all group pages:
   - Dashboard page
   - Leaderboard page  
   - Tournaments page
   - Submit page
   - Tournament details page
   - Profile page itself

All the functionality remains exactly the same - it still links to `/golf/profile` and maintains all the profile management features. The only change is the display name which now consistently shows "Player Card" throughout the entire site instead of "Profile".

---

**User**

I also noticed when I intially set my birthday, it populated my birthday week tournament correctly but it's gone now. I went and save my birthday again but it went away - can you troubleshoot that to make sure it's saving my birthday information and reflecting that correctly permanently after I put in my birthday that inital time

---

**Cursor**

I'll troubleshoot the birthday saving issue. Let me check how birthdays are being saved and how birthday tournaments are being created.

I can see the issue! There are two different birthday storage systems in your codebase:

1. **Old system**: Uses `birthday` field as a date string in the profile (like "2024-01-15")
2. **New system**: Uses `birth_month` and `birth_day` as separate integer fields

The birthday tournament creation is looking for `birth_month` and `birth_day` fields, but your profile page is saving to the `birthday` field. Let me check what's actually in your database and fix this:

I found the issue! The profile page is saving the birthday as a date string to the `birthday` field, but the tournament creation system is looking for `birth_month` and `birth_day` integer fields. I need to update the profile save function to convert the date to the separate month/day fields:

```typescriptreact
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !profile) return;

    setSaving(true);
    setMessage('');

    try {
      // Prepare update data
      const updateData: any = {
        display_name: profile.display_name,
        birthday: profile.birthday || null,
        updated_at: new Date().toISOString()
      };

      // If birthday is provided, also save as separate month/day fields for tournament system
      if (profile.birthday) {
        const birthdayDate = new Date(profile.birthday);
        updateData.birth_month = birthdayDate.getMonth() + 1; // Convert 0-based to 1-based
        updateData.birth_day = birthdayDate.getDate();
      } else {
        // Clear the separate fields if birthday is removed
        updateData.birth_month = null;
        updateData.birth_day = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // If birthday was set, trigger birthday tournament check
      if (profile.birthday) {
        try {
          const { checkAndCreateBirthdayTournaments } = await import('../../../lib/tournaments');

