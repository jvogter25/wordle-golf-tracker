"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';

export default function WorkingAdminPage() {
  console.log('🆕 BRAND NEW ADMIN PAGE LOADED!', new Date().toISOString());
  
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchGroups = async () => {
      console.log('🔍 FETCHING GROUPS - NEW APPROACH');
      setLoading(true);
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('👤 USER:', user?.email);
        
        if (authError || !user) {
          console.log('❌ AUTH ERROR:', authError);
          setLoading(false);
          return;
        }

        // Method 1: Try to get all groups (simplest approach)
        console.log('📋 TRYING: Get all groups');
        const { data: allGroups, error: allGroupsError } = await supabase
          .from('groups')
          .select('*');
        
        console.log('📋 ALL GROUPS RESULT:', { 
          data: allGroups, 
          error: allGroupsError,
          count: allGroups?.length 
        });

        // Method 2: Try to get groups via group_members
        console.log('👥 TRYING: Get groups via membership');
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            groups (*)
          `)
          .eq('user_id', user.id);
        
        console.log('👥 MEMBER GROUPS RESULT:', { 
          data: memberData, 
          error: memberError,
          count: memberData?.length 
        });

        // Use whichever method worked
        let finalGroups = [];
        if (allGroups && allGroups.length > 0) {
          finalGroups = allGroups;
          console.log('✅ USING ALL GROUPS');
        } else if (memberData && memberData.length > 0) {
          finalGroups = memberData.map(m => m.groups).filter(g => g !== null);
          console.log('✅ USING MEMBER GROUPS');
        }

        console.log('🎯 FINAL GROUPS:', finalGroups);
        setGroups(finalGroups);
        
        if (finalGroups.length > 0) {
          setSelectedGroup(finalGroups[0].id);
        }
        
      } catch (error) {
        console.error('💥 ERROR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [supabase]);

  const updateGroupCode = async () => {
    if (!selectedGroup || !newGroupCode.trim()) {
      toast.error('Please select a group and enter a code');
      return;
    }

    console.log('🔄 UPDATING GROUP CODE:', { selectedGroup, newGroupCode });

    try {
      const { error } = await supabase
        .from('groups')
        .update({ invite_code: newGroupCode.trim().toUpperCase() })
        .eq('id', selectedGroup);

      if (error) {
        console.error('❌ UPDATE ERROR:', error);
        toast.error('Error updating group code');
        return;
      }

      toast.success('Group code updated successfully!');
      setNewGroupCode("");
      
      // Refresh groups
      window.location.reload();
    } catch (error) {
      console.error('💥 UPDATE ERROR:', error);
      toast.error('Unexpected error');
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Group code copied to clipboard!');
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Working Admin Center</h1>
        
        {/* Status */}
        <div className="bg-green-500 text-white p-4 rounded-lg mb-4 text-center font-bold">
          🆕 FRESH ADMIN PAGE - NO CACHE ISSUES
          <br />
          ⏰ {new Date().toLocaleTimeString()}
        </div>
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
            Loading groups...
          </div>
        )}
        
        {/* Debug Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm">
          <div className="font-semibold mb-2">Debug Info:</div>
          <div>Groups Found: {groups.length}</div>
          <div>Selected Group: {selectedGroup}</div>
          <div>Groups Data: {JSON.stringify(groups.map(g => ({ id: g.id, name: g.name, code: g.invite_code })), null, 2)}</div>
        </div>

        {/* Group Code Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Group Invite Codes</h2>
          
          {groups.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedGroupData && (
                <div>
                  <label className="block text-sm font-medium mb-2">Current Invite Code</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono flex-1">
                      {selectedGroupData.invite_code || 'No code set'}
                    </code>
                    {selectedGroupData.invite_code && (
                      <button
                        onClick={() => copyGroupCode(selectedGroupData.invite_code)}
                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Set New Invite Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new code (e.g., FAMILY2024)"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={updateGroupCode}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Set Code
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code with others so they can join your group
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No groups found</p>
              <p className="text-sm text-gray-500">
                Make sure you've created a group or are a member of one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 