                      <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                        Birthday
                      </label>
                      <input
                        type="date"
                        value={profile?.birthday || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, birthday: e.target.value } : prev)}
                        className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Used for birthday tournaments
                      </p>
                      {profile?.birthday && (
                        <button
                          type="button"
                          onClick={handleCreateTournament}
                          disabled={creatingTournament}
                          className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition text-sm font-semibold disabled:opacity-50"
                        >
                          {creatingTournament ? 'Creating...' : '🎂 Create Birthday Tournament'}
                        </button>
                      )}
                    </div>
```

Perfect! Now I've added several improvements to help debug and fix the birthday tournament issue:

## ✅ **Enhanced Birthday Tournament System**

### **New Features Added:**

1. **Better Error Handling & Logging**:
   - Added detailed console logs to track tournament creation process
   - Better error messages that distinguish between different failure types
   - Warning message type for non-critical issues

2. **Manual Tournament Creation Button**:
   - Added a "🎂 Create Birthday Tournament" button that appears when you have a birthday set
   - This lets you manually trigger tournament creation for testing
   - Shows detailed feedback about what happened

3. **Improved Feedback**:
   - Shows how many tournaments were created
   - Distinguishes between "tournament created" vs "tournament already exists"
   - Explains when no tournament is needed (birthday not within 2 weeks)

### **How to Test:**

1. **Set your birthday** in the profile form
2. **Click "Save Profile"** - this will automatically try to create a tournament
3. **Use the yellow "🎂 Create Birthday Tournament" button** for manual testing
4. **Check the browser console** (F12 → Console tab) for detailed logs
5. **Look for success/warning messages** that explain what happened

### **What to Look For:**

- ✅ **Success**: "Profile updated successfully! X birthday tournament(s) created."
- ⚠️ **Already Exists**: "Birthday tournament already exists for this year!"
- ⚠️ **Not Time Yet**: "No birthday tournaments needed at this time (birthday may not be within 2 weeks)."
- ❌ **Error**: Detailed error message explaining what went wrong

Try setting your birthday and using the manual button - this should help us figure out exactly what's happening with your tournament creation!

---

**User**

You know what would be easier now that I think of it, I as the admin shoudl just be able to create tournements myself and name them. There should be an option when I create the tournament to either be a "Major" or "Birthday" format, if I pick "Birthday" I should manually chose which users birthday tournament it is then birthday stroke advantage rule applies to them

---

**Cursor**

That's a much better approach! Let me create an admin tournament creation interface that gives you full control over creating tournaments, including birthday tournaments where you can manually select the birthday person.

---

**User**

As an admin I should also be able to set the date range and the tournaments page should show "Upcoming" "Active" and "Past" tournaments so I can set them up in advance. It should prioritize showing an active tournament at the top of that page and it should have a count down in days for upcoming tournaments

---

**Cursor**

Perfect! I can see there's already an admin structure. Let me create a tournament management section within the admin page. I'll add a tournament creation interface to the existing admin page:

```typescriptreact
  const [newScore, setNewScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const supabase = createClientComponentClient<Database>();

  // Tournament management state
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    type: 'major' as 'major' | 'birthday',
    start_date: '',
    end_date: '',
    venue: 'Wordle Golf',
    birthday_user_id: '',
    birthday_advantage: 0.5
  });
```

```typescriptreact
        setScores(scoresData || []);
        
        // Fetch groups - try different approaches to bypass RLS issues
        console.log('🏢 FETCHING GROUPS...');
```

Let me add the tournament fetching and management functions:

```typescriptreact
        }
        setScores(scoresData || []);
        
        // Fetch tournaments
        console.log('Fetching tournaments...');
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: false });
        console.log('Tournaments result:', { data: tournamentsData?.length, error: tournamentsError });
        if (tournamentsError) {
          errorList.push(`Tournaments error: ${tournamentsError.message}`);
        }
        setTournaments(tournamentsData || []);
        
        // Fetch groups - try different approaches to bypass RLS issues
        console.log('🏢 FETCHING GROUPS...');
```

Now let me add the tournament management functions:

```typescriptreact
  const createTestGroup = async () => {
    const testGroupName = `Test Group ${Date.now()}`;
    const testInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('groups')
      .insert([
        {
          name: testGroupName,
          description: 'Test group created by admin',
          invite_code: testInviteCode
        }
      ])
      .select();

    if (error) {
      console.error('Error creating test group:', error);
      toast.error(`Failed to create test group: ${error.message}`);
    } else {
      console.log('Test group created:', data);
      toast.success(`Test group "${testGroupName}" created with code: ${testInviteCode}`);
      // Refresh the page to show the new group
      window.location.reload();
    }
  };

  // Tournament management functions
  const createTournament = async () => {
    if (!tournamentForm.name.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }

    if (!tournamentForm.start_date || !tournamentForm.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    if (tournamentForm.type === 'birthday' && !tournamentForm.birthday_user_id) {
      toast.error('Please select a birthday person for birthday tournaments');
      return;
    }

    try {
      const tournamentData = {
        name: tournamentForm.name,
        tournament_type: tournamentForm.type,
        year: new Date(tournamentForm.start_date).getFullYear(),
        start_date: tournamentForm.start_date,
        end_date: tournamentForm.end_date,
        venue: tournamentForm.venue,
        is_active: true,
        ...(tournamentForm.type === 'birthday' && {
          birthday_user_id: tournamentForm.birthday_user_id,
          birthday_advantage: tournamentForm.birthday_advantage
        })
      };

      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select();

      if (error) {
        console.error('Error creating tournament:', error);
        toast.error(`Failed to create tournament: ${error.message}`);
      } else {
        console.log('Tournament created:', data);
        toast.success(`Tournament "${tournamentForm.name}" created successfully!`);
        
        // Reset form and close modal
        setTournamentForm({
          name: '',
          type: 'major',
          start_date: '',
          end_date: '',
          venue: 'Wordle Golf',
          birthday_user_id: '',
          birthday_advantage: 0.5
        });
        setShowCreateTournament(false);
        
        // Refresh tournaments list
        const { data: tournamentsData } = await supabase
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: false });
        setTournaments(tournamentsData || []);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) {
        console.error('Error deleting tournament:', error);
        toast.error(`Failed to delete tournament: ${error.message}`);
      } else {
        toast.success('Tournament deleted successfully!');

