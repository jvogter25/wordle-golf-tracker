"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserGroups } from '../../../lib/groups';
import { checkAndCreateBirthdayTournaments } from '../../../lib/tournaments';

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

function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(s.getMonth()+1)}/${pad(s.getDate())} - ${pad(e.getMonth()+1)}/${pad(e.getDate())}`;
}

export default function TournamentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (user) {
      getUserGroups(supabase).then(setGroups);
      // Check for upcoming birthdays and create tournaments
      checkAndCreateBirthdayTournaments(supabase).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (groups.length === 1 && selectedGroup === '') {
      setSelectedGroup(groups[0].id);
    }
    if (selectedGroup) {
      fetchTournaments();
    }
  }, [selectedGroup, groups]);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_participants(count)
      `)
      .eq('year', new Date().getFullYear())
      .eq('tournament_type', 'birthday')  // Only fetch birthday tournaments
      .order('start_date', { ascending: true });
    
    // Add participant count to each tournament
    const tournamentsWithCounts = (data || []).map(t => ({
      ...t,
      participant_count: t.tournament_participants?.[0]?.count || 0
    }));
    
    setTournaments(tournamentsWithCounts);
    setFetchError(error);
    setLoading(false);
  };

  // Partition tournaments
  const now = new Date();
  const active = tournaments.filter(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now && t.is_active);
  const upcomingBirthdays = tournaments.filter(t => t.tournament_type === 'birthday' && new Date(t.start_date) > now);
  const past = tournaments.filter(t => new Date(t.end_date) < now);

  // Show next upcoming birthday tournament
  const nextBirthday = upcomingBirthdays.length > 0 ? [upcomingBirthdays[0]] : [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <Link href="/auth/login" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
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
        <WordleHeader label="TOURNAMENTS" />
        
        <div className="mb-8">
          {groups.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <select
                className="p-2 border rounded"
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
              >
                <option value="">Select a group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Active Tournament Section */}
          {active.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Active Tournament</h3>
              {active.map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border-2 border-green-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      {t.tournament_type === 'birthday' ? '🎂 Birthday' : 'Major'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming Birthday Tournaments */}
          {nextBirthday.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Upcoming Birthday Tournament</h3>
              {nextBirthday.map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border-2 border-yellow-400 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      🎂 Birthday
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] bg-yellow-50 px-3 py-2 rounded-lg mt-3">
                      <span className="font-medium text-yellow-800">Birthday Tournament</span> - Special 0.5 stroke advantage for the birthday person!
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No Tournaments Message */}
          {active.length === 0 && nextBirthday.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎂</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Tournaments</h3>
              <p className="text-gray-600 mb-4">Birthday tournaments are created automatically when someone's birthday is coming up!</p>
              <p className="text-sm text-gray-500">Make sure to set your birthday in your profile to participate in birthday tournaments.</p>
            </div>
          )}

          {/* Past Tournaments - Only show tournaments that actually had participants */}
          {past.filter(t => t.participant_count > 0).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Past Tournaments</h3>
              <div className="space-y-2">
                {past.filter(t => t.participant_count > 0).slice(0, 5).map(t => (
                  <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block">
                    <div className="bg-[hsl(var(--card))] rounded-lg shadow p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                      </div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {t.tournament_type === 'birthday' ? '🎂 Birthday' : 'Major'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 