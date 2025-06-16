'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Head from 'next/head';

const wordleTiles = [
  { letter: 'L', color: 'bg-[#6aaa64]' }, // green
  { letter: 'E', color: 'bg-[#c9b458]' }, // yellow
  { letter: 'A', color: 'bg-[#787c7e]' }, // gray
  { letter: 'D', color: 'bg-[#6aaa64]' }, // green
  { letter: 'E', color: 'bg-[#c9b458]' }, // yellow
  { letter: 'R', color: 'bg-[#787c7e]' }, // gray
  { letter: 'B', color: 'bg-[#6aaa64]' }, // green
  { letter: 'O', color: 'bg-[#c9b458]' }, // yellow
  { letter: 'A', color: 'bg-[#787c7e]' }, // gray
  { letter: 'R', color: 'bg-[#6aaa64]' }, // green
  { letter: 'D', color: 'bg-[#c9b458]' }, // yellow
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

function WordleHeader({ label }: { label: string }) {
  // Map label to Wordle tile colors in a repeating pattern
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

export default function GolfHomepage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top Navigation Bar */}
      <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))]">
        {/* Profile Section */}
        <Link href="/golf/player" className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="/golf/jake-avatar.jpg"
              alt="Jake Vogter"
              className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary))] object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[hsl(var(--primary))] rounded-full border-2 border-[hsl(var(--card))]" />
          </div>
          <div className="hidden md:block">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Jake Vogter</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Handicap: +1.2</p>
          </div>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center justify-end">
          <BurgerMenu />
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex flex-col w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            <Link href="/golf/homepage" className="flex items-center space-x-3 px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-lg">
              <span>Dashboard</span>
            </Link>
            <Link href="/golf/leaderboard" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Leaderboard</span>
            </Link>
            <Link href="/golf/clubhouse" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Clubhouse</span>
            </Link>
            <Link href="/golf/submit" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Submit Score</span>
            </Link>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[hsl(var(--muted-foreground))]/60 z-50">
            <div className="bg-[hsl(var(--card))] w-64 min-h-screen p-4">
              <nav className="space-y-2">
                <Link href="/golf/homepage" className="flex items-center space-x-3 px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-lg">
                  <span>Dashboard</span>
                </Link>
                <Link href="/golf/leaderboard" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Leaderboard</span>
                </Link>
                <Link href="/golf/clubhouse" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Clubhouse</span>
                </Link>
                <Link href="/golf/submit" className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Submit Score</span>
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            <WordleHeader label="HOME" />

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">⛳</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">USGA Golf Scoring</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Convert Wordle attempts to authentic golf scores with eagles, birdies, and bogeys</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Major Tournaments</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Four annual championships matching real golf majors with cuts and leaderboards</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🎂</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Birthday Tournaments</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Personal celebration tournaments with stroke advantages for birthday players</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Handicap System</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Fair competition with automatic USGA-style handicap calculations</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Family Groups</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Private family competitions with secure invite codes</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Easy Score Entry</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Quick score submission with easy online upload</p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-8 shadow-md mb-12">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 text-center">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Play Wordle</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Complete your daily Wordle puzzle</p>
                </div>
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Submit Score</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Enter your attempts (1-7)</p>
                </div>
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Get Golf Score</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Automatic conversion to golf terminology</p>
                </div>
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">4</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Compete</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Track rankings and tournament progress</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 