"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserGroups } from '../../../lib/groups';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../src/types/supabase';

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

// Simple date formatter for 'Month YYYY'
function formatJoinDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

type TournamentWin = {
  type: 'gold' | 'silver' | 'bronze';
  date: string;
  name: string;
};

export default function DevPlayerCardPage() {
  const [displayName, setDisplayName] = useState('Jake Vogter');
  const [editingName, setEditingName] = useState(false);
  const [profilePic, setProfilePic] = useState('/golf/jake-avatar.jpg');
  const [handicap, setHandicap] = useState('+1.5'); // TODO: fetch from Supabase
  const [bio, setBio] = useState('');
  const [groups, setGroups] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const [tournamentWins, setTournamentWins] = useState<TournamentWin[]>([]);
  const [monthlyWins, setMonthlyWins] = useState<{ year: number; month: number }[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!authLoading && user) {
      getUserGroups().then(setGroups);
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchTournamentWins = async () => {
      if (!user) return;
      // Fetch all tournaments where user finished 1st, 2nd, or 3rd
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`final_position, tournaments (name, start_date)`)
        .eq('user_id', user.id)
        .in('final_position', [1, 2, 3]);
      if (!error && data) {
        setTournamentWins(data.map((win: any) => ({
          type: win.final_position === 1 ? 'gold' : win.final_position === 2 ? 'silver' : 'bronze',
          date: win.tournaments && typeof win.tournaments === 'object' && 'start_date' in win.tournaments ? formatJoinDate(win.tournaments.start_date) : '',
          name: win.tournaments && typeof win.tournaments === 'object' && 'name' in win.tournaments ? win.tournaments.name : '',
        })));
      }
    };
    fetchTournamentWins();
  }, [user]);

  useEffect(() => {
    const fetchMonthlyWins = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('monthly_winners')
        .select('year, month')
        .eq('user_id', user.id);
      if (!error && data) {
        setMonthlyWins(data);
      }
    };
    fetchMonthlyWins();
  }, [user]);

  // Profile pic upload handler
  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const url = URL.createObjectURL(file);
      setProfilePic(url);
    } else if (file) {
      alert('File must be 5MB or less.');
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <Link href="/golf/player" className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={profilePic}
                alt={displayName}
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
        <WordleHeader label="PLAYER CARD" />
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))] text-center">
          <div className="mb-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full mx-auto bg-[#6aaa64] flex items-center justify-center text-white text-3xl font-bold border-4 border-[hsl(var(--border))] overflow-hidden mb-2">
              <img src={profilePic} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-2 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
              Change Profile Picture (max 5MB)
            </label>
            <div className="flex items-center justify-center gap-2">
              {editingName ? (
                <input
                  className="border rounded-md px-2 py-1 text-lg font-bold text-center"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  autoFocus
                />
              ) : (
                <h2
                  className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2 mb-2 cursor-pointer"
                  onClick={() => setEditingName(true)}
                  title="Click to edit name"
                >
                  {displayName}
                </h2>
              )}
            </div>
            <p className="text-[hsl(var(--muted-foreground))]">Handicap: {handicap}</p>
          </div>
          <div className="mb-6">
            {/* Tournament Winner Badges (real data) */}
            {tournamentWins.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mt-8 mb-2">Tournament Winner Badges</h2>
                <div className="flex gap-2 mb-4">
                  {tournamentWins.map((badge, i) => (
                    <span key={i} className="bg-gray-100 rounded px-3 py-1 text-lg flex items-center gap-1">
                      {badge.type === 'gold' && '🥇'}
                      {badge.type === 'silver' && '🥈'}
                      {badge.type === 'bronze' && '🥉'}
                      {badge.date}
                    </span>
                  ))}
                </div>
              </>
            )}
            {/* Monthly Winner Badges (real data) */}
            {monthlyWins.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-2">Monthly Winner Badges</h2>
                <div className="flex gap-2 mb-4">
                  {monthlyWins.map((win, i) => {
                    const date = new Date(win.year, win.month - 1);
                    const label = `${date.toLocaleString('default', { month: 'long' })} '${String(win.year).slice(-2)}`;
                    return (
                      <span key={i} className="bg-yellow-200 rounded px-3 py-1 text-sm font-semibold flex items-center gap-1">
                        🥇 {label}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div className="text-left">
            <div className="flex flex-col gap-2 mt-4">
              <div><span className="font-semibold">Joined:</span> {user?.created_at ? formatJoinDate(user.created_at) : ''}</div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Player Bio:</span>
              <textarea className="w-full mt-1 p-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] resize-none" rows={3} placeholder="Write something about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Groups Section */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">Groups</h3>
          {groups.length === 0 ? (
            <div className="text-[hsl(var(--muted-foreground))]">You are not in any groups yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {groups.map(group => (
                <Link key={group.id} href={`/golf/clubhouse/${group.id}`} className="bg-[hsl(var(--muted))] rounded-lg shadow-md p-4 flex flex-col items-center hover:bg-[hsl(var(--accent))] transition border border-[hsl(var(--border))]">
                  <div className="font-semibold text-base mb-2 text-[hsl(var(--foreground))]">{group.name}</div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{group.member_count || 0} members</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 