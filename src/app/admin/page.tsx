'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Group = Database['public']['Tables']['groups']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function AdminCenter() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || (session.user.email !== 'jakevogt25@gmail.com' && session.user.email !== 'jake.vogt@softchoice.com')) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      fetchGroups();
      fetchUsers();
    };

    checkAdmin();
  }, [router, supabase]);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching groups');
      return;
    }

    setGroups(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching users');
      return;
    }

    setUsers(data || []);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const { error } = await supabase
      .from('groups')
      .insert([{ name: newGroupName.trim() }]);

    if (error) {
      toast.error('Error creating group');
      return;
    }

    toast.success('Group created successfully');
    setNewGroupName('');
    fetchGroups();
  };

  const updateInviteCode = async (groupId: string) => {
    if (!newInviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    // Check if invite code already exists
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', newInviteCode.trim().toUpperCase())
      .neq('id', groupId)
      .single();

    if (existingGroup) {
      toast.error('This invite code is already in use');
      return;
    }

    const { error } = await supabase
      .from('groups')
      .update({ invite_code: newInviteCode.trim().toUpperCase() })
      .eq('id', groupId);

    if (error) {
      toast.error('Error updating invite code');
      return;
    }

    toast.success('Invite code updated successfully');
    setEditingGroupId(null);
    setNewInviteCode('');
    fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will remove all group data and cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      toast.error('Error deleting group');
      return;
    }

    toast.success('Group deleted successfully');
    fetchGroups();
  };

  const copyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Center</h1>
      
      <div className="grid gap-8">
        {/* Create Group Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Button onClick={createGroup}>Create Group</Button>
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Groups & Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-white rounded-lg shadow border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => deleteGroup(group.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  {/* Invite Code Section */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Invite Code:</span>
                      {group.invite_code && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteCode(group.invite_code)}
                        >
                          Copy Code
                        </Button>
                      )}
                    </div>
                    
                    {editingGroupId === group.id ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter new invite code (e.g., FAMILY2024)"
                          value={newInviteCode}
                          onChange={(e) => setNewInviteCode(e.target.value)}
                          className="flex-1"
                          maxLength={10}
                        />
                        <Button onClick={() => updateInviteCode(group.id)}>
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingGroupId(null);
                            setNewInviteCode('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                          {group.invite_code || 'No code set'}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingGroupId(group.id);
                            setNewInviteCode(group.invite_code || '');
                          }}
                        >
                          {group.invite_code ? 'Edit Code' : 'Set Code'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                >
                  <div>
                    <h3 className="font-semibold">{user.display_name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 