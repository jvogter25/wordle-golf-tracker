"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserGroups, joinGroupByCode, createGroup } from '../../../lib/groups';

const navLinks = [
  { href: '/golf/homepage', label: 'Home' },
  { href: '/golf/leaderboard', label: 'Leaderboard' },
  { href: '/golf/player', label: 'Player Card' },
  { href: '/golf/tournaments', label: 'Tournaments' },
  { href: '/golf/submit', label: 'Submit Score' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
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
  const { user, loading: authLoading, supabase } = useAuth();
  console.log('DEBUG: Current user from useAuth:', user);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      getUserGroups(supabase).then(setGroups).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      await joinGroupByCode(joinCode.trim().toUpperCase());
      setMessage('Successfully joined group!');
      setShowJoinForm(false);
      setJoinCode('');
      setLoading(true);
      getUserGroups(supabase).then(setGroups).finally(() => setLoading(false));
    } catch (err) {
      setMessage(err.message || 'Error joining group');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await createGroup(newGroupName.trim());
      setShowCreateForm(false);
      setNewGroupName('');
      setLoading(true);
      getUserGroups(supabase).then(setGroups).finally(() => setLoading(false));
    } catch (err) {
      setMessage(err.message || 'Error creating group');
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in</div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
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
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))]">
          {groups.length === 0 ? (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Not in a group yet</h2>
              <button className="bg-[#6aaa64] text-white px-4 py-2 rounded" onClick={() => setShowJoinForm(true)}>Enter Group Code</button>
              {showJoinForm && (
                <form onSubmit={handleJoinGroup} className="mt-4 flex flex-col items-center gap-2">
                  <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Group Code" className="p-2 border rounded" required maxLength={6} />
                  <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded">Join</button>
                  <button type="button" className="text-xs mt-2" onClick={() => setShowJoinForm(false)}>Cancel</button>
                </form>
              )}
              {message && <div className="mt-2 text-red-600">{message}</div>}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8 text-center">Your Groups</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {groups.map(group => (
                  <Link key={group.id} href={`/golf/clubhouse/${group.id}`} className="bg-[hsl(var(--muted))] rounded-lg shadow-md p-6 flex flex-col items-center hover:bg-[hsl(var(--accent))] transition border border-[hsl(var(--border))]">
                    <div className="font-semibold text-lg mb-3 text-[hsl(var(--foreground))]">{group.name}</div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{group.member_count} members</span>
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-col items-center gap-4 mt-8">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : 'Create Group'}
            </button>
            {showCreateForm && (
              <form onSubmit={handleCreateGroup} className="flex flex-col items-center gap-2 w-full max-w-xs">
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name" className="p-2 border rounded w-full" required maxLength={32} />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">Create</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 