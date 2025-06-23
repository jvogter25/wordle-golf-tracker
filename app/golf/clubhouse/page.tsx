"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Users, Settings, Plus, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import { joinGroupByCode, createGroup, updateGroup, deleteGroup } from '../../../lib/groups';
import NavigationAvatar from '../../../components/NavigationAvatar';
import Navigation from '../../../components/Navigation';

function WordleHeader({ label }: { label: string }) {
  const colors = ['bg-[#6aaa64]', 'bg-[#c9b458]', 'bg-[#787c7e]'];
  return (
    <div className="flex justify-center gap-1 mb-8">
      {label.split('').map((letter, idx) => (
        <span
          key={idx}
          className={`${colors[idx % colors.length]} w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-md font-bold text-white text-2xl md:text-3xl shadow-[0_2px_4px_rgba(0,0,0,0.12)] select-none`}
          style={{ fontFamily: 'Montserrat, Poppins, Arial, sans-serif', letterSpacing: '0.05em' }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export default function ClubhousePage() {
  const { user, supabase } = useAuth();
  const { selectedGroup, availableGroups, setSelectedGroup, refreshGroups } = useGroup();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRenameGroup, setShowRenameGroup] = useState(false);
  const [selectedGroupForRename, setSelectedGroupForRename] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      refreshGroups();
    }
  }, [user, refreshGroups]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user || !supabase) return;

    setIsJoining(true);
    try {
      await joinGroupByCode(supabase, joinCode.trim());
      setMessage('Successfully joined group!');
      setJoinCode('');
      refreshGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      setMessage(error.message || 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user || !supabase) return;

    setIsCreating(true);
    try {
      const group = await createGroup(supabase, newGroupName.trim(), newGroupDescription.trim() || undefined);
      setMessage('Group created successfully!');
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      refreshGroups();
      
      // Auto-select the new group and navigate to it
      setTimeout(() => {
        setSelectedGroup(group);
        window.location.href = `/golf/${group.id}/dashboard`;
      }, 1000);
    } catch (error: any) {
      console.error('Error creating group:', error);
      setMessage(error.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !selectedGroupForRename || !supabase) return;

    setIsUpdating(true);
    try {
      await updateGroup(supabase, selectedGroupForRename.id, { 
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined 
      });
      setMessage('Group updated successfully!');
      setNewGroupName('');
      setNewGroupDescription('');
      setShowRenameGroup(false);
      setSelectedGroupForRename(null);
      refreshGroups();
    } catch (error: any) {
      console.error('Error updating group:', error);
      setMessage(error.message || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async (group: any) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    if (!supabase) return;

    try {
      await deleteGroup(supabase, group.id);
      setMessage('Group deleted successfully!');
      refreshGroups();
      
      // If this was the selected group, clear selection
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    } catch (error: any) {
      console.error('Error deleting group:', error);
      setMessage(error.message || 'Failed to delete group');
    }
  };

  const openRenameDialog = (group: any) => {
    setSelectedGroupForRename(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setShowRenameGroup(true);
  };

  const handleEnterGroup = (groupId: string) => {
    const group = availableGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
      // Navigate to group dashboard
      window.location.href = `/golf/${groupId}/dashboard`;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Use the new Navigation component with global context */}
        <Navigation 
          context="global" 
          centerLink={{
            href: "/golf/homepage",
            label: "Home"
          }}
        />

        <WordleHeader label="CLUBHOUSE" />

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('Successfully') || message.includes('copied') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Current Group Display */}
        {selectedGroup && (
          <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mb-6 border-2 border-[#6aaa64]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
                  Currently in: {selectedGroup.name}
                </h2>
                <p className="text-[hsl(var(--muted-foreground))]">
                  Group code: {selectedGroup.invite_code}
                </p>
              </div>
              <Link
                href={`/golf/${selectedGroup.id}/dashboard`}
                className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition"
              >
                Enter Group
              </Link>
            </div>
          </div>
        )}

        {/* Create Group Section */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <Plus size={24} />
            Create New Group
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            Start your own Wordle Golf group and invite friends and family to compete!
          </p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition"
          >
            Create Group
          </button>
        </div>

        {/* Join Group Section */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <Plus size={24} />
            Join a Group
          </h2>
          <form onSubmit={handleJoinGroup} className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter group invite code"
              className="flex-1 px-4 py-2 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[#6aaa64]"
              disabled={isJoining}
              required
            />
            <button
              type="submit"
              disabled={isJoining || !joinCode.trim()}
              className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>
        </div>

        {/* Available Groups */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <Users size={24} />
            Your Groups
          </h2>
          
          {availableGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                You haven't joined any groups yet.
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Ask a group admin for an invite code to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition"
                >
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">
                      {group.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Code: {group.invite_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnterGroup(group.id)}
                      className="bg-[#6aaa64] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition"
                    >
                      Enter
                    </button>
                    <button
                      onClick={() => openRenameDialog(group)}
                      className="bg-[#c9b458] text-white px-3 py-2 rounded-lg font-semibold hover:bg-[#b8a347] transition"
                      title="Edit Group"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
                      title="Delete Group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Center */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <Settings size={24} />
            Admin Center
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            Manage groups, members, scores, and tournaments.
          </p>
          <Link
            href="/golf/clubhouse/admin"
            className="bg-[#c9b458] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#b8a347] transition inline-flex items-center gap-2"
          >
            <Settings size={20} />
            Open Admin Center
          </Link>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Smith Family Golf"
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[#6aaa64]"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Brief description of your group..."
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[#6aaa64]"
                    rows={3}
                    disabled={isCreating}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGroup(false);
                      setNewGroupName('');
                      setNewGroupDescription('');
                    }}
                    className="px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newGroupName.trim()}
                    className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rename Group Modal */}
        {showRenameGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Update Group</h3>
              
              <form onSubmit={handleRenameGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name"
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[#6aaa64]"
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Brief description of your group..."
                    className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[#6aaa64]"
                    rows={3}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRenameGroup(false);
                      setSelectedGroupForRename(null);
                      setNewGroupName('');
                      setNewGroupDescription('');
                    }}
                    className="px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !newGroupName.trim()}
                    className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 