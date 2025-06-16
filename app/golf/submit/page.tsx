"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { submitScore } from '../../../lib/scores';
import { getUserGroups } from '../../../lib/groups';

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

const attemptOptions = [
  { value: 1, label: '1 - Hole in One', emoji: '⛳️' },
  { value: 2, label: '2 - Eagle', emoji: '🦅' },
  { value: 3, label: '3 - Birdie', emoji: '🐦‍⬛' },
  { value: 4, label: '4 - Par', emoji: '🏌️' },
  { value: 5, label: '5 - Bogey', emoji: '😬' },
  { value: 6, label: '6 - Double Bogey', emoji: '😱' },
  { value: 7, label: '7 - Failed', emoji: '❌' },
];

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

export default function DevSubmitScorePage() {
  const [attempts, setAttempts] = useState<number | ''>('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, supabase } = useAuth();

  useEffect(() => {
    if (user) {
      getUserGroups(supabase).then(setGroups);
    }
  }, [user]);

  useEffect(() => {
    if (groups.length === 1 && selectedGroup === '') {
      setSelectedGroup(groups[0].id);
    }
  }, [groups, selectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attempts || !selectedGroup) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!user) {
      setError('Not logged in');
      setSubmitting(false);
      return;
    }

    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Submit score using the library function
      await submitScore(supabase, selectedGroup, attempts, today);

      setSuccess(true);
      setAttempts('');
      // Redirect to leaderboard after 2 seconds
      setTimeout(() => {
        router.push('/golf/leaderboard');
      }, 2000);

    } catch (err) {
      console.error('Error submitting score:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-md mx-auto">
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
        <WordleHeader label="SUBMIT" />
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Submit Your Score</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Score submitted successfully! Redirecting to leaderboard...
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {groups.length > 1 && (
              <div>
                <label className="block text-[hsl(var(--muted-foreground))] mb-1">Select Group</label>
                <select
                  className="w-full p-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[hsl(var(--muted-foreground))] mb-1">Wordle Attempts</label>
              <select 
                className="w-full p-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                value={attempts}
                onChange={(e) => setAttempts(e.target.value ? Number(e.target.value) : '')}
                disabled={submitting}
                required
              >
                <option value="">Select attempts</option>
                {attemptOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#6aaa64] text-white font-bold py-2 rounded-md hover:bg-[#5a9954] transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !attempts || !selectedGroup}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 