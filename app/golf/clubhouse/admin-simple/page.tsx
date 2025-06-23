"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export default function AdminSimplePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchGroups = async () => {
      console.log('Fetching groups...');
      
      // SIMPLE: Just get groups, nothing else
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*');
      
      console.log('Groups result:', { data: groupsData, error });
      
      if (!error && groupsData) {
        setGroups(groupsData);
        if (groupsData.length > 0) {
          setSelectedGroup(groupsData[0].id);
        }
      }
      
      setLoading(false);
    };
    
    fetchGroups();
  }, [supabase]);

  const updateGroupCode = async () => {
    if (!selectedGroup || !newGroupCode.trim()) {
      toast.error('Please select a group and enter a code');
      return;
    }

    const { error } = await supabase
      .from('groups')
      .update({ invite_code: newGroupCode.trim().toUpperCase() })
      .eq('id', selectedGroup);

    if (error) {
      toast.error('Error updating group code');
      console.error(error);
      return;
    }

    toast.success('Group code updated!');
    setNewGroupCode("");
    
    // Refresh groups
    const { data: groupsData } = await supabase.from('groups').select('*');
    if (groupsData) setGroups(groupsData);
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Group Code Admin</h1>
        
        {groups.length > 0 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            
            {selectedGroupData && (
              <div>
                <label className="block text-sm font-medium mb-2">Current Code</label>
                <div className="bg-gray-100 px-3 py-2 rounded font-mono text-lg">
                  {selectedGroupData.invite_code || 'No code set'}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">New Group Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={updateGroupCode}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>No groups found</div>
        )}
      </div>
    </div>
  );
} 