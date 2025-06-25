"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

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
        className="bg-[#6aaa64] text-white px-4 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation menu"
      >
        {open ? "Close" : "Menu"}
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

// Mock tournament data
const tournaments = [
  {
    id: 'masters-2024',
    name: 'The Masters',
    type: 'major',
    start: '2024-04-08',
    end: '2024-04-14',
    phase: 'qualifying', // 'qualifying', 'cut', 'tournament', 'finished'
    participants: [
      { id: '1', name: 'Jake', score: 12 },
      { id: '2', name: 'Annika', score: 14 },
      { id: '3', name: 'Rory', score: 15 },
      { id: '4', name: 'Lexi', score: 16 },
    ],
    cutLine: 2, // index of last player to make the cut
    birthdayUser: null,
  },
  {
    id: 'jake-bday-2024',
    name: "Jake's Birthday Week",
    type: 'birthday',
    start: '2024-06-10',
    end: '2024-06-16',
    phase: 'tournament',
    participants: [
      { id: '1', name: 'Jake', score: 10 },
      { id: '2', name: 'Annika', score: 13 },
      { id: '3', name: 'Rory', score: 14 },
      { id: '4', name: 'Lexi', score: 15 },
    ],
    cutLine: 1,
    birthdayUser: 'Jake',
  },
];

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

export default function DevTournamentsPage() {
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
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Tournaments</h2>
          <div className="grid gap-6">
            {tournaments.map(t => (
              <Link key={t.id} href={`/golf/tournaments/${t.id}`} className="block">
                <div className="bg-[hsl(var(--card))] rounded-xl shadow p-6 border border-[hsl(var(--border))] hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-lg">{t.name} {t.type === 'birthday' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Birthday</span>}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{formatDateRange(t.start, t.end)}</div>
                  </div>
                  <div className="mb-2 text-sm">Phase: <span className="font-bold">{formatPhase(getTournamentPhase(t))}</span></div>
                  {t.birthdayUser && <div className="mb-2 text-xs text-green-700">🎂 {t.birthdayUser} gets -0.5 strokes/day</div>}
                  <div className="mt-2">
                    <div className="font-semibold mb-1">Leaderboard</div>
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="py-1">Name</th>
                          <th className="py-1">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getEligiblePlayers(t).map(p => (
                          <tr key={p.id}>
                            <td className="py-1">{p.name}</td>
                            <td className="py-1">{p.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 