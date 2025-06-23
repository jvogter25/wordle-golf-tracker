        
        // Refresh tournaments list
        const { data: tournamentsData } = await supabase
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: false });
        setTournaments(tournamentsData || []);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Failed to delete tournament');
    }
  };
```

Now let me add the tournament management UI to the admin page:

Now let me add the tournament management UI section:

```typescriptreact
        )}
        
        {/* Tournament Management Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tournament Management</h2>
            <button
              onClick={() => setShowCreateTournament(true)}
              className="bg-[#6aaa64] text-white px-4 py-2 rounded-md hover:bg-[#599a5b] transition"
            >
              Create Tournament
            </button>
          </div>
          
          {/* Existing Tournaments */}
          <div className="space-y-3">
            {tournaments.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-center py-4">No tournaments created yet</p>
            ) : (
              tournaments.map(tournament => (
                <div key={tournament.id} className="border border-[hsl(var(--border))] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                        <p>📅 {tournament.start_date} to {tournament.end_date}</p>
                        <p>🏆 Type: {tournament.tournament_type === 'birthday' ? '🎂 Birthday' : '🏅 Major'}</p>
                        <p>📍 Venue: {tournament.venue}</p>
                        <p>🎮 Status: {tournament.is_active ? '✅ Active' : '❌ Inactive'}</p>
                        {tournament.tournament_type === 'birthday' && (
                          <p>🎁 Advantage: {tournament.birthday_advantage} strokes</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTournament(tournament.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition ml-4"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Tournament Modal */}
        {showCreateTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create Tournament</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tournament Name</label>
                  <input
                    type="text"
                    value={tournamentForm.name}
                    onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                    placeholder="e.g., Jake's Birthday Championship"
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tournament Type</label>
                  <select
                    value={tournamentForm.type}
                    onChange={(e) => setTournamentForm({...tournamentForm, type: e.target.value as 'major' | 'birthday'})}
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  >
                    <option value="major">🏅 Major Tournament</option>
                    <option value="birthday">🎂 Birthday Tournament</option>
                  </select>
                </div>

                {tournamentForm.type === 'birthday' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Birthday Person</label>
                      <select
                        value={tournamentForm.birthday_user_id}
                        onChange={(e) => setTournamentForm({...tournamentForm, birthday_user_id: e.target.value})}
                        className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                      >
                        <option value="">Select Birthday Person</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>{member.display_name || member.email}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Birthday Advantage (strokes)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={tournamentForm.birthday_advantage}
                        onChange={(e) => setTournamentForm({...tournamentForm, birthday_advantage: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Stroke advantage given to the birthday person (recommended: 0.5)
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={tournamentForm.start_date}
                    onChange={(e) => setTournamentForm({...tournamentForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={tournamentForm.end_date}
                    onChange={(e) => setTournamentForm({...tournamentForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    value={tournamentForm.venue}
                    onChange={(e) => setTournamentForm({...tournamentForm, venue: e.target.value})}
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCreateTournament(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createTournament}
                  className="flex-1 bg-[#6aaa64] text-white px-4 py-2 rounded-md hover:bg-[#599a5b] transition"
                >
                  Create Tournament
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Group Members Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
```

Perfect! Now let me also remove the automatic birthday tournament creation from the profile page since you'll be managing tournaments manually:

```typescriptreact
      // If birthday was set, trigger birthday tournament check
      if (profile.birthday) {
        try {
          console.log('🎂 Birthday set, checking for tournament creation...');
          const { checkAndCreateBirthdayTournaments } = await import('../../../lib/tournaments');
          const results = await checkAndCreateBirthdayTournaments(supabase);
          console.log('🏆 Tournament creation results:', results);
          
          // Show success message if tournaments were created
          const successfulCreations = results.filter(r => r.success && r.tournament);
          if (successfulCreations.length > 0) {
            setMessage(`Profile updated successfully! ${successfulCreations.length} birthday tournament(s) created.`);
          }
        } catch (tournamentError) {
          console.error('❌ Error creating birthday tournaments:', tournamentError);
          // Show a more informative message
          setMessage('Profile updated successfully, but there was an issue creating birthday tournaments. Please try again or contact support.');
          setMessageType('warning');
          // Don't fail the profile save if tournament creation fails
        }
      } else {
        setMessage('Profile updated successfully!');
        setMessageType('success');
      }

->

      setMessage('Profile updated successfully!');
      setMessageType('success');
```

```typescriptreact
      if (error) {
        throw error;
      }

      setMessage('Profile updated successfully!');
      setMessageType('success');
```

Let me also remove the manual tournament creation button since tournaments will be managed through admin:

```typescriptreact
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
```

Let me remove the birthday tournament creation button from the UI:

```typescriptreact
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Used for birthday tournaments
                      </p>
```

Perfect! Now I've created a comprehensive admin tournament management system. Here's what I've implemented:

## ✅ **Admin Tournament Management System**

### **New Features Added:**

1. **Tournament Management Section** in Admin Panel (`/golf/clubhouse/admin`):
   - View all existing tournaments
   - Create new tournaments with full control
   - Delete tournaments
   - Real-time tournament list updates

2. **Tournament Creation Modal** with options for:
   - **Tournament Name**: Custom naming (e.g., "Jake's Birthday Championship")
   - **Tournament Type**: 
     - 🏅 **Major Tournament**: Standard tournament for everyone
     - 🎂 **Birthday Tournament**: Special tournament with birthday advantages
   - **Birthday Person Selection**: Choose which user gets the birthday advantage
   - **Birthday Advantage**: Configurable stroke advantage (default 0.5)
   - **Date Range**: Start and end dates
   - **Venue**: Tournament location

3. **Tournament Display** shows:
   - Tournament name and dates
   - Tournament type (Major/Birthday)
   - Venue and status
   - Birthday advantage amount (for birthday tournaments)
   - Delete option

### **How to Use:**

1. **Go to Admin Panel**: Navigate to `/golf/clubhouse/admin`
2. **Create Tournament**: Click "Create Tournament" button
3. **Choose Type**: Select "Major" or "Birthday" tournament
4. **For Birthday Tournaments**:
   - Select the birthday person from dropdown
   - Set stroke advantage (0.5 recommended)
   - Name it something fun like "Jake's Birthday Championship"
5. **Set Dates**: Choose start and end dates for the tournament
6. **Create**: Click "Create Tournament"

### **Birthday Tournament Benefits:**
- The selected birthday person gets the configured stroke advantage during the tournament
- Tournament appears in the tournaments page with birthday styling
- Automatic scoring advantages applied during gameplay
- Perfect for celebrating birthdays with competitive fun!

This gives you complete control over tournament creation and timing, without relying on automatic birthday detection. You can create tournaments whenever you want and customize everything about them!

---

**User**

The local host page is stuck on the dashboard right now, nothing else is working

---

**Cursor**

Let me check what might be causing the dashboard to get stuck. This could be a JavaScript error or an infinite loop. Let me look at the dashboard code:

