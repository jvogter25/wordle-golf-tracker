"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Users, Settings, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import { joinGroupByCode } from '../../../lib/groups';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const { availableGroups, selectedGroup, setSelectedGroup, loading, refreshGroups } = useGroup();
  const { supabase } = useAuth();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleSelectGroup = (group: any) => {
    setSelectedGroup(group);
    toast.success(`Switched to ${group.name}`);
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setJoining(true);
    try {
      await joinGroupByCode(supabase, inviteCode.trim());
      toast.success('Successfully joined group!');
      setInviteCode('');
      setShowJoinForm(false);
      await refreshGroups();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Please sign in</h2>
          <Link href="/auth/login" className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <Link href="/golf/player" className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/golf/jake-avatar.jpg"
                alt="Jake Vogter"
                className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary))] object-cover"
              />
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

        <WordleHeader label="CLUBHOUSE" />

        {/* Current Group Display */}
        {selectedGroup && (
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Currently Active</h2>
                <div className="flex items-center gap-3">
                  <Users className="text-[#6aaa64]" size={24} />
                  <span className="text-lg font-medium text-[hsl(var(--foreground))]">{selectedGroup.name}</span>
                </div>
              </div>
              <Link 
                href="/golf/clubhouse/admin-working"
                className="flex items-center gap-2 px-4 py-2 bg-[#6aaa64] text-white rounded-lg hover:bg-[#599a5b] transition font-semibold"
              >
                <Settings size={16} />
                Manage
              </Link>
            </div>
          </div>
        )}

        {/* Available Groups */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-6">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Your Groups</h2>
          
          {availableGroups.length > 0 ? (
            <div className="space-y-3">
              {availableGroups.map(group => (
                <div 
                  key={group.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition cursor-pointer ${
                    selectedGroup?.id === group.id 
                      ? 'border-[#6aaa64] bg-green-50' 
                      : 'border-[hsl(var(--border))] hover:border-[#6aaa64]'
                  }`}
                  onClick={() => handleSelectGroup(group)}
                >
                  <div className="flex items-center gap-3">
                    <Users className={selectedGroup?.id === group.id ? 'text-[#6aaa64]' : 'text-[hsl(var(--muted-foreground))]'} size={20} />
                    <div>
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{group.description}</p>
                      )}
                    </div>
                  </div>
                  {selectedGroup?.id === group.id && (
                    <span className="text-sm font-medium text-[#6aaa64]">Active</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto text-[hsl(var(--muted-foreground))] mb-4" size={48} />
              <p className="text-[hsl(var(--muted-foreground))] mb-4">You're not a member of any groups yet</p>
              <button
                onClick={() => setShowJoinForm(true)}
                className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition font-semibold"
              >
                Join a Group
              </button>
            </div>
          )}
        </div>

        {/* Join Group Section */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Join New Group</h2>
          
          {!showJoinForm ? (
            <button
              onClick={() => setShowJoinForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#6aaa64] text-white rounded-lg hover:bg-[#599a5b] transition font-semibold"
            >
              <Plus size={16} />
              Join Group with Code
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code (e.g., FAMILY2024)"
                  className="w-full p-3 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent"
                  maxLength={10}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleJoinGroup}
                  disabled={joining || !inviteCode.trim()}
                  className="px-6 py-2 bg-[#6aaa64] text-white rounded-lg hover:bg-[#599a5b] transition font-semibold disabled:bg-[hsl(var(--muted))] disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setInviteCode('');
                  }}
                  className="px-6 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--muted))] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 