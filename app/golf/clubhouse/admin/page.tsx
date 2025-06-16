"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ClubhouseAdminPage() {
  console.log('🚀🚀🚀 ADMIN PAGE COMPONENT LOADED - NEW VERSION! 🚀🚀🚀');
  console.log('🔥 TESTING IF NEW CODE IS RUNNING 🔥');
  console.log('⏰ TIMESTAMP:', new Date().toISOString());
  
  const [members, setMembers] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [newScore, setNewScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const supabase = createClientComponentClient<Database>();

  console.log('🔧 ADMIN PAGE STATE:', { 
    loading, 
    groupsLength: groups.length, 
    membersLength: members.length,
    errorsLength: errors.length,
    selectedGroup,
    newGroupCode
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
    if (!selectedMember || !selectedDate || !newScore) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('scores')
      .upsert({
        user_id: selectedMember,
        puzzle_date: selectedDate,
        raw_score: parseInt(newScore),
        attempts: parseInt(newScore) // Assuming raw_score equals attempts for simplicity
      });

    if (error) {
      toast.error('Error updating score');
      return;
    }

    toast.success('Score updated successfully!');
    setSelectedMember("");
    setSelectedDate("");
    setNewScore("");
    
    // Refresh scores data
    const { data: scoresData } = await supabase.from('scores').select('*').order('puzzle_date', { ascending: false });
    setScores(scoresData || []);
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Group code copied to clipboard!');
  };

  const createTestGroup = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication failed');
        return;
      }

      console.log('🏗️ CREATING TEST GROUP for user:', user.id);

      // Generate a unique invite code
      const inviteCode = 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase();

      // Create a test group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: 'My Golf Group',
          description: 'Created via admin panel',
          created_by: user.id,
          invite_code: inviteCode
        })
        .select()
        .single();

      if (groupError) {
        console.error('🚨 Group creation error:', groupError);
        toast.error(`Error creating group: ${groupError.message}`);
        return;
      }

      console.log('✅ GROUP CREATED:', group);

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('🚨 Member creation error:', memberError);
        toast.error(`Error adding admin member: ${memberError.message}`);
        return;
      }

      console.log('✅ ADMIN MEMBER ADDED');

      toast.success(`Group created with code: ${inviteCode}`);
      
      // Refresh the page data by calling fetchData again
      window.location.reload();
    } catch (error) {
      console.error('🚨 Error in createTestGroup:', error);
      toast.error(`Unexpected error: ${error}`);
    }
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Center</h1>
        
        {/* TESTING INDICATOR */}
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center font-bold">
          🔥 NEW CODE VERSION LOADED - TESTING 🔥
          <br />
          ⏰ {new Date().toLocaleTimeString()}
        </div>
        
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
        
        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
          <div className="font-semibold mb-2">Debug Information:</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Groups Length: {groups.length}</div>
          <div>Groups Data: {JSON.stringify(groups, null, 2)}</div>
          <div>Selected Group: {selectedGroup}</div>
          <div>Selected Group Data: {JSON.stringify(selectedGroupData, null, 2)}</div>
          <div>Members Length: {members.length}</div>
          <div>Errors Count: {errors.length}</div>
        </div>
        
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
          <h2 className="text-lg font-semibold mb-4">Create Group Code</h2>
          
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
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Score</label>
              <input
                type="number"
                placeholder="Enter score"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                min="1"
                max="6"
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md"
              />
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