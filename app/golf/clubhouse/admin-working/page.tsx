"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import Link from 'next/link';
import { Menu, X, Trash2 } from 'lucide-react';
import { deleteGroup } from '../../../../lib/groups';

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

const navLinks = [
  { href: '/golf/homepage', label: 'Home' },
  { href: '/golf/leaderboard', label: 'Leaderboard' },
  { href: '/golf/player', label: 'Player Card' },
  { href: '/golf/tournaments', label: 'Tournaments' },
  { href: '/golf/submit', label: 'Submit Score' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
  { href: '/golf/clubhouse/admin-working', label: 'Admin Center' },
];

function BurgerMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="p-2 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-md"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation menu"
      >
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 flex flex-col">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 border-b border-[hsl(var(--border))] last:border-b-0 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] font-semibold text-base transition"
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

export default function WorkingAdminPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Check admin access
        if (user.email !== 'jakevogt25@gmail.com') {
          setLoading(false);
          return;
        }

        // Try to get all groups first
        const { data: allGroups, error: allGroupsError } = await supabase
          .from('groups')
          .select('*');

        // Try to get groups via group_members as backup
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            groups (*)
          `)
          .eq('user_id', user.id);

        // Use whichever method worked
        let finalGroups = [];
        if (allGroups && allGroups.length > 0) {
          finalGroups = allGroups;
        } else if (memberData && memberData.length > 0) {
          finalGroups = memberData.map(m => m.groups).filter(g => g !== null);
        }

        setGroups(finalGroups);
        
        if (finalGroups.length > 0) {
          setSelectedGroup(finalGroups[0].id);
        }
        
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [supabase]);

  // Admin access check
  if (!loading && (!user || user.email !== 'jakevogt25@gmail.com')) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Access Denied</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">This page is restricted to administrators only.</p>
          <Link href="/golf/homepage" className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const updateGroupCode = async () => {
    if (!selectedGroup || !newGroupCode.trim()) {
      toast.error('Please select a group and enter a code');
      return;
    }

    try {
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
      
      // Refresh groups
      window.location.reload();
    } catch (error) {
      toast.error('Unexpected error');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone and will remove all members and data associated with this group.`)) {
      return;
    }

    try {
      await deleteGroup(supabase, groupId);
      toast.success('Group deleted successfully!');
      
      // Refresh groups
      window.location.reload();
    } catch (error) {
      console.error('Delete group error:', error);
      toast.error(error.message || 'Error deleting group');
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
        {/* Navigation Header */}
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <Link href="/golf/player" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary))] bg-gray-100 flex items-center justify-center">
                <span role="img" aria-label="avatar">👤</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[hsl(var(--primary))] rounded-full border-2 border-[hsl(var(--card))]" />
            </div>
          </Link>
          <div className="flex-1 flex justify-center">
            <Link href="/golf/homepage" className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">Home</Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu />
          </div>
        </nav>

        <WordleHeader label="ADMIN CENTER" />
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
            Loading groups...
          </div>
        )}

        {/* Group Code Management */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">Group Invite Codes</h2>
          
          {groups.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Select Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-3 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
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
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Current Invite Code</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-[hsl(var(--muted))] px-4 py-3 rounded-lg text-lg font-mono flex-1 text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                      {selectedGroupData.invite_code || 'No code set'}
                    </code>
                    {selectedGroupData.invite_code && (
                      <button
                        onClick={() => copyGroupCode(selectedGroupData.invite_code)}
                        className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition font-semibold"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Set New Invite Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new code (e.g., FAMILY2024)"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="flex-1 p-3 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                  />
                  <button
                    onClick={updateGroupCode}
                    className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition font-semibold"
                  >
                    Set Code
                  </button>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                  Share this code with others so they can join your group
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">No groups found</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Make sure you've created a group or are a member of one
              </p>
            </div>
          )}
        </div>

        {/* Group Management Section */}
        {groups.length > 0 && (
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mt-6">
            <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--foreground))]">Group Management</h2>
            
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{group.name}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Code: <span className="font-mono">{group.invite_code || 'No code set'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 