"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { format, subDays } from 'date-fns';

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

// Mock leaderboard data
const leaderboard = [
  {
    id: 1,
    name: 'Jake Vogter',
    avatar: '/golf/jake-avatar.jpg',
    today: 2, // 🦅
    handicap: '+1.5',
  },
  {
    id: 2,
    name: 'Annika Sörenstam',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    today: 3, // 🐦‍⬛
    handicap: '+0.8',
  },
  {
    id: 3,
    name: 'Rory McIlroy',
    avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
    today: 4, // 🏌️
    handicap: '+2.2',
  },
  {
    id: 4,
    name: 'Lexi Thompson',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    today: 1, // ⛳️
    handicap: '+1.0',
  },
  {
    id: 5,
    name: 'Brooks Koepka',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    today: 5, // 😬
    handicap: '+0.5',
  },
  {
    id: 6,
    name: 'Jon Rahm',
    avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
    today: 6, // 😱
    handicap: '+2.8',
  },
  {
    id: 7,
    name: 'Dustin Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/77.jpg',
    today: 7, // ❌
    handicap: '+1.7',
  },
];

// Generate rolling week dates (last 7 days, ending today, PST)
const today = new Date();
const weekDates = Array.from({ length: 7 }, (_, i) => {
  const d = subDays(today, 6 - i);
  return format(d, 'M/d');
});

// Emoji mapping for Today score
const scoreToEmoji = {
  1: '⛳️',
  2: '🦅',
  3: '🐦‍⬛',
  4: '🏌️',
  5: '😬',
  6: '😱',
  7: '❌',
};

// Mock monthly leaderboard data
const monthlyLeaderboard = [
  { id: '1', name: 'Jake', score: 42, isWinner: true },
  { id: '2', name: 'Annika', score: 45, isWinner: false },
  { id: '3', name: 'Rory', score: 47, isWinner: false },
  { id: '4', name: 'Lexi', score: 48, isWinner: false },
];
const currentMonth = 'June, 24';

// Mock all-time leaderboard data
const allTimeLeaderboard = [
  { id: '1', name: 'Jake', score: 420 },
  { id: '2', name: 'Annika', score: 450 },
  { id: '3', name: 'Rory', score: 470 },
  { id: '4', name: 'Lexi', score: 480 },
];

export default function DevLeaderboardPage() {
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
        <WordleHeader label="LEADERBOARD" />
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">All Time Leaderboard</h2>
          <div className="divide-y divide-[hsl(var(--border))]">
            {/* Header Row */}
            <div className="flex items-center py-2 px-2 font-bold text-[hsl(var(--muted-foreground))] text-xs md:text-sm">
              <div className="w-10 text-left">Pos</div>
              <div className="flex-1 text-left pl-2">Name</div>
              <div className="w-16 text-right">Today</div>
            </div>
            {/* Player Rows */}
            {leaderboard.map((player, idx) => {
              // Find ties
              let pos: string = String(idx + 1);
              if (idx > 0 && leaderboard[idx].today === leaderboard[idx - 1].today) {
                pos = `T${idx}`;
              }
              // Green for top 3
              const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
              return (
                <div key={player.id} className="flex items-center py-4 px-2 bg-[hsl(var(--muted))] rounded-xl my-2 shadow-sm">
                  <div className="w-10 text-left font-bold text-base md:text-lg">{pos}</div>
                  <div className="flex-1 flex items-center pl-2">
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary))] mr-2" />
                    <div className="flex flex-col justify-center">
                      <span className={`truncate text-base md:text-lg ${nameClass} mb-0.5`} style={{lineHeight: '1.1'}}>{player.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">HCP {player.handicap}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-2xl">{scoreToEmoji[player.today]}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Monthly Leaderboard</h2>
          <table className="w-full text-left mb-2">
            <thead>
              <tr>
                <th className="py-1">Name</th>
                <th className="py-1">Score</th>
                <th className="py-1">Badge</th>
              </tr>
            </thead>
            <tbody>
              {monthlyLeaderboard.map(player => (
                <tr key={player.id}>
                  <td className="py-1">{player.name}</td>
                  <td className="py-1">{player.score}</td>
                  <td className="py-1">{player.isWinner && <span className="bg-yellow-300 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">{currentMonth}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 