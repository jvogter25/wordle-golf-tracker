"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getUserGroups } from '../../../lib/groups';

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

function getTournamentPhase(tournament) {
  // This would use real date logic in production
  return tournament.phase;
}

function getEligiblePlayers(tournament) {
  if (tournament.phase === 'tournament') {
    return tournament.participants.slice(0, tournament.cutLine + 1);
  }
  return tournament.participants;
}

function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(s.getMonth()+1)}/${pad(s.getDate())} - ${pad(e.getMonth()+1)}/${pad(e.getDate())}`;
}

function formatPhase(phase) {
  if (phase === 'qualifying') return 'Qualifying';
  if (phase === 'tournament') return 'Tournament';
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

export default function TournamentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserGroups().then(setGroups);
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchTournaments();
    }
  }, [selectedGroup]);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('year', new Date().getFullYear())
      .order('start_date', { ascending: true });
    setTournaments(data || []);
    setLoading(false);
  };

  // Partition tournaments
  const now = new Date();
  const active = tournaments.filter(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now && t.is_active);
  const upcomingMajors = tournaments.filter(t => t.tournament_type === 'major' && new Date(t.start_date) > now);
  const upcomingBirthdays = tournaments.filter(t => t.tournament_type === 'birthday' && new Date(t.start_date) > now);
  const past = tournaments.filter(t => new Date(t.end_date) < now);

  // Only show the next upcoming major and birthday (for any group member)
  const nextMajor = upcomingMajors.length > 0 ? [upcomingMajors[0]] : [];
  const nextBirthday = upcomingBirthdays.length > 0 ? [upcomingBirthdays[0]] : [];

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
          {/* Active Section */}
          {active.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Active Tournament</h3>
              {active.map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border-2 border-green-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name} {t.tournament_type === 'birthday' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Birthday</span>}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="mb-2 text-sm">Phase: <span className="font-bold">Active</span></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Upcoming Section */}
          {(nextMajor.length > 0 || nextBirthday.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Upcoming Tournaments</h3>
              {nextMajor.map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border-2 border-blue-400 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="mb-2 text-sm">Phase: <span className="font-bold">Upcoming</span></div>
                  </div>
                </Link>
              ))}
              {nextBirthday.map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border-2 border-yellow-400 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name} <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Birthday</span></div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="mb-2 text-sm">Phase: <span className="font-bold">Upcoming</span></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Past Section */}
          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Past Tournaments</h3>
              {past.slice().reverse().map(t => (
                <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block mb-4">
                  <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border border-[hsl(var(--border))] hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">{t.name} {t.tournament_type === 'birthday' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Birthday</span>}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start_date, t.end_date)}</div>
                    </div>
                    <div className="mb-2 text-sm">Phase: <span className="font-bold">Completed</span></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 