"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import Navigation from '../../../../components/Navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ClubhouseAdminPage() {
  
  const [members, setMembers] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [puzzleNumber, setPuzzleNumber] = useState("");
  const [newScore, setNewScore] = useState("");
  const [todaysPuzzleNumber, setTodaysPuzzleNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const supabase = createClientComponentClient();

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



  useEffect(() => {
    const fetchData = async () => {
      console.log('Admin page: Starting data fetch...');
      setLoading(true);
      const errorList: string[] = [];
      
      try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Auth check:', { user: user?.email, error: authError });
        
        if (authError || !user) {
          errorList.push('Authentication failed');
          setErrors(errorList);
          setLoading(false);
          return;
        }
        
        // Fetch group members from profiles table
        console.log('Fetching profiles...');
        const { data: membersData, error: membersError } = await supabase.from('profiles').select('*');
        console.log('Profiles result:', { data: membersData, error: membersError });
        if (membersError) {
          errorList.push(`Profiles error: ${membersError.message}`);
        }
        setMembers(membersData || []);
        
        // Fetch scores
        console.log('Fetching scores...');
        const { data: scoresData, error: scoresError } = await supabase.from('scores').select('*').order('puzzle_date', { ascending: false });
        console.log('Scores result:', { data: scoresData?.length, error: scoresError });
        if (scoresError) {
          errorList.push(`Scores error: ${scoresError.message}`);
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
        
        // Try 1: Get groups where user is a member (via group_members table)
        console.log('🏢 TRYING: Groups via group_members...');
        const { data: memberGroupsData, error: memberGroupsError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            groups (
              id,
              name,
              description,
              invite_code,
              created_by,
              created_at
            )
          `)
          .eq('user_id', user.id);
        
        console.log('🏢 MEMBER GROUPS RESULT:', { 
          data: memberGroupsData, 
          error: memberGroupsError,
          dataLength: memberGroupsData?.length
        });

        // Try 2: Get all groups (fallback)
        const { data: allGroupsData, error: allGroupsError } = await supabase.from('groups').select('*');
        console.log('🏢 ALL GROUPS RESULT:', { 
          data: allGroupsData, 
          error: allGroupsError,
          dataLength: allGroupsData?.length,
          firstGroup: allGroupsData?.[0]
        });
        
        // Try 3: Get groups where user is creator
        const { data: userGroupsData, error: userGroupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('created_by', user.id);
        console.log('🏢 USER CREATED GROUPS RESULT:', { 
          data: userGroupsData, 
          error: userGroupsError,
          dataLength: userGroupsData?.length
        });

        // Determine which groups to use
        let finalGroups = [];
        if (memberGroupsData && memberGroupsData.length > 0) {
          // Use groups from membership table
          finalGroups = memberGroupsData.map(mg => mg.groups).filter(g => g !== null);
          console.log('✅ USING MEMBER GROUPS:', finalGroups);
        } else if (allGroupsData && allGroupsData.length > 0) {
          // Use all groups as fallback
          finalGroups = allGroupsData;
          console.log('✅ USING ALL GROUPS:', finalGroups);
        } else if (userGroupsData && userGroupsData.length > 0) {
          // Use user-created groups
          finalGroups = userGroupsData;
          console.log('✅ USING USER CREATED GROUPS:', finalGroups);
        }

        if (memberGroupsError) {
          errorList.push(`Member groups error: ${memberGroupsError.message}`);
          console.log('❌ MEMBER GROUPS ERROR:', memberGroupsError);
        }
        if (allGroupsError) {
          errorList.push(`All groups error: ${allGroupsError.message}`);
          console.log('❌ ALL GROUPS ERROR:', allGroupsError);
        }
        if (userGroupsError) {
          errorList.push(`User groups error: ${userGroupsError.message}`);
          console.log('❌ USER GROUPS ERROR:', userGroupsError);
        }

        setGroups(finalGroups);
        
        if (finalGroups && finalGroups.length > 0) {
          setSelectedGroup(finalGroups[0].id);
          console.log('✅ SELECTED FIRST GROUP:', {
            id: finalGroups[0].id,
            name: finalGroups[0].name,
            inviteCode: finalGroups[0].invite_code
          });
        } else {
          console.log('❌ NO GROUPS FOUND');
          errorList.push('No groups found - you may need to create a group first');
        }
        
        setErrors(errorList);
      } catch (error) {
        console.error('Error in fetchData:', error);
        errorList.push(`Fetch error: ${error}`);
        setErrors(errorList);
      } finally {
        setLoading(false);
      }
    };
    
    // Setup today's puzzle number
    const wordleStart = new Date('2021-06-19');
    const todayDate = new Date();
    const diffTime = todayDate.getTime() - wordleStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedPuzzleNumber = diffDays;
    
    setTodaysPuzzleNumber(calculatedPuzzleNumber);
    setPuzzleNumber(calculatedPuzzleNumber.toString());
    
    fetchData();
  }, [supabase]);

  const addMember = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // This would typically send an invitation
    toast.success('Member invitation sent!');
    setNewEmail("");
  };

  const updateGroupCode = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }

    if (!newGroupCode.trim()) {
      toast.error('Please enter a group code');
      return;
    }

    // Check if code already exists
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', newGroupCode.trim().toUpperCase())
      .neq('id', selectedGroup)
      .single();

    if (existingGroup) {
      toast.error('This group code is already in use');
      return;
    }

    const { error } = await supabase
      .from('groups')
      .update({ invite_code: newGroupCode.trim().toUpperCase() })
      .eq('id', selectedGroup);

    if (error) {
      toast.error('Error updating group code');
      return;
    }

    toast.success('Group code updated successfully!');
    setNewGroupCode("");
    
    // Refresh groups data
    const { data: groupsData } = await supabase.from('groups').select('*');
    setGroups(groupsData || []);
  };

  const updateScore = async () => {
    if (!selectedMember || !puzzleNumber || !newScore || !selectedGroup) {
      toast.error('Please fill in all fields and select a group');
      return;
    }

    const rawScore = parseInt(newScore);
    const puzzleNum = parseInt(puzzleNumber);

    if (rawScore < 1 || rawScore > 7) {
      toast.error('Score must be between 1 and 7 (7 for failed attempts)');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has already submitted for this puzzle number
      const { data: existingSubmission, error: checkError } = await supabase
        .from('scores')
        .select('id')
        .eq('user_id', selectedMember)
        .eq('group_id', selectedGroup)
        .eq('puzzle_number', puzzleNum)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubmission) {
        // Update existing score (admin override)
        const { error } = await supabase
          .from('scores')
          .update({
            raw_score: rawScore,
            attempts: rawScore,
            golf_score: rawScore === 1 ? 'Hole-in-One' : rawScore === 2 ? 'Eagle' : rawScore === 3 ? 'Birdie' : rawScore === 4 ? 'Par' : rawScore === 5 ? 'Bogey' : rawScore === 6 ? 'Double Bogey' : 'Failed',
            submitted_by_admin: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);

        if (error) throw error;
        toast.success('Score updated successfully (admin override)!');
      } else {
        // Insert new score
        const { error } = await supabase
          .from('scores')
          .insert({
            user_id: selectedMember,
            group_id: selectedGroup,
            raw_score: rawScore,
            puzzle_number: puzzleNum,
            puzzle_date: today,
            attempts: rawScore,
            golf_score: rawScore === 1 ? 'Hole-in-One' : rawScore === 2 ? 'Eagle' : rawScore === 3 ? 'Birdie' : rawScore === 4 ? 'Par' : rawScore === 5 ? 'Bogey' : rawScore === 6 ? 'Double Bogey' : 'Failed',
            submitted_by_admin: true
          });

        if (error) throw error;
        toast.success('Score submitted successfully!');
      }
      
      // Reset form
      setSelectedMember("");
      setPuzzleNumber("");
      setNewScore("");
      
      // Refresh scores data
      const { data: scoresData } = await supabase.from('scores').select('*').order('puzzle_date', { ascending: false });
      setScores(scoresData || []);
      
    } catch (error: any) {
      console.error('Error updating score:', error);
      toast.error(`Error updating score: ${error.message}`);
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Group code copied to clipboard!');
  };

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

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <Navigation 
          context="global" 
          centerLink={{
            href: "/golf/clubhouse",
            label: "Clubhouse"
          }}
        />
        
        <h1 className="text-2xl font-bold mb-6">Admin Center</h1>
        
        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
            Loading admin data...
          </div>
        )}
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            <div className="font-semibold mb-2">Errors:</div>
            {errors.map((error, idx) => (
              <div key={idx}>• {error}</div>
            ))}
          </div>
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
          <h2 className="text-lg font-semibold mb-4">Group Members</h2>
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              />
              <button
                onClick={addMember}
                className="bg-[#6aaa64] text-white px-4 py-2 rounded-md hover:bg-[#599a5b] transition"
              >
                Add
              </button>
            </div>
          </div>
          <ul>
            {members.map(m => (
              <li key={m.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>{m.display_name} <span className="text-xs text-[hsl(var(--muted-foreground))]">({m.email})</span></span>
              </li>
            ))}
          </ul>
        </div>

        {/* Create Group Code Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Create Group Code</h2>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              🔄 Refresh Groups
            </button>
          </div>
          
          {groups.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedGroupData && (
                <div>
                  <label className="block text-sm font-medium mb-2">Current Group Code</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono flex-1">
                      {selectedGroupData.invite_code || 'No code set'}
                    </code>
                    {selectedGroupData.invite_code && (
                      <button
                        onClick={() => copyGroupCode(selectedGroupData.invite_code)}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition text-sm"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">New Group Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter group code (e.g., FAMILY2024)"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="flex-1 px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                  />
                  <button
                    onClick={updateGroupCode}
                    className="bg-[#6aaa64] text-white px-4 py-2 rounded-md hover:bg-[#599a5b] transition"
                  >
                    Set Code
                  </button>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Users can join your group using this code
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">No groups found. Create a group first.</p>
              <button
                onClick={createTestGroup}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Create Test Group
              </button>
            </div>
          )}
        </div>

        {/* Admin Center Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-lg font-semibold mb-4">Edit Score</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Member</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              >
                <option value="">Select Member</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Puzzle Number</label>
              <input
                type="number"
                value={puzzleNumber}
                onChange={(e) => setPuzzleNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                placeholder="e.g., 924"
                min="1"
              />
              {todaysPuzzleNumber && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Today's puzzle is #{todaysPuzzleNumber}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Score (1-7)</label>
              <select
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              >
                <option value="">Select score</option>
                <option value="1">1 - ⛳️ Hole-in-One</option>
                <option value="2">2 - 🦅 Eagle</option>
                <option value="3">3 - 🐦‍⬛ Birdie</option>
                <option value="4">4 - 🏌️ Par</option>
                <option value="5">5 - 😬 Bogey</option>
                <option value="6">6 - 😱 Double Bogey</option>
                <option value="7">7 - ❌ Failed</option>
              </select>
            </div>
            
            <button
              onClick={updateScore}
              className="w-full bg-[#6aaa64] text-white py-2 rounded-md hover:bg-[#599a5b] transition"
            >
              Update Score
            </button>
          </div>
        </div>

        {/* Recent Scores Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold mb-4">Recent Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Player</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 10).map(s => (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="py-2">{members.find(m => m.id === s.user_id)?.display_name || 'Unknown'}</td>
                    <td className="py-2">{new Date(s.puzzle_date).toLocaleDateString()}</td>
                    <td className="py-2">{s.raw_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 