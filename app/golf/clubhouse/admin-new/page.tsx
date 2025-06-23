"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../src/types/supabase';
import { toast } from 'sonner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminNewPage() {
  console.log('🚀🚀🚀 NEW ADMIN PAGE LOADED! 🚀🚀🚀');
  console.log('⏰ TIMESTAMP:', new Date().toISOString());
  
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchGroups = async () => {
      console.log('🏢 FETCHING GROUPS IN NEW ADMIN PAGE...');
      setLoading(true);
      const errorList: string[] = [];
      
      try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('🔐 Auth check:', { user: user?.email, error: authError });
        
        if (authError || !user) {
          errorList.push('Authentication failed');
          setErrors(errorList);
          setLoading(false);
          return;
        }
        
        // Try to fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*');
        
        console.log('🏢 GROUPS RESULT:', { 
          data: groupsData, 
          error: groupsError,
          dataLength: groupsData?.length,
          firstGroup: groupsData?.[0]
        });
        
        if (groupsError) {
          errorList.push(`Groups error: ${groupsError.message}`);
          console.log('❌ GROUPS ERROR:', groupsError);
        } else {
          setGroups(groupsData || []);
          if (groupsData && groupsData.length > 0) {
            setSelectedGroup(groupsData[0].id);
            console.log('✅ SELECTED FIRST GROUP:', {
              id: groupsData[0].id,
              name: groupsData[0].name,
              inviteCode: groupsData[0].invite_code
            });
          }
        }
        
        setErrors(errorList);
      } catch (error) {
        console.error('❌ Error in fetchGroups:', error);
        errorList.push(`Fetch error: ${error}`);
        setErrors(errorList);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [supabase]);

  const updateGroupCode = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }

    if (!newGroupCode.trim()) {
      toast.error('Please enter a group code');
      return;
    }

    console.log('🔄 UPDATING GROUP CODE:', {
      selectedGroup,
      newGroupCode: newGroupCode.trim().toUpperCase()
    });

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
      console.log('❌ UPDATE ERROR:', error);
      toast.error('Error updating group code');
      return;
    }

    toast.success('Group code updated successfully!');
    setNewGroupCode("");
    
    // Refresh groups data
    const { data: groupsData } = await supabase.from('groups').select('*');
    setGroups(groupsData || []);
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Group code copied to clipboard!');
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">NEW Admin Center</h1>
        
        {/* SUCCESS INDICATOR */}
        <div className="bg-green-500 text-white p-4 rounded-lg mb-4 text-center font-bold">
          ✅ NEW ADMIN PAGE WORKING! ✅
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
          <div>Errors Count: {errors.length}</div>
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
              <p className="text-[hsl(var(--muted-foreground))]">No groups found. Create a group first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 