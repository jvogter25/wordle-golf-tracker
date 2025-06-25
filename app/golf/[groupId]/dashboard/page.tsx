'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import { useGroup } from '../../../../contexts/GroupContext';
import { useAuth } from '../../../../contexts/AuthContext';
import NavigationAvatar from '../../../../components/NavigationAvatar';

const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
];

function BurgerMenu({ groupId }: { groupId: string }) {
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
          {menuItems.map(link => (
            <Link
              key={link.label}
              href={link.href(groupId)}
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

export default function GroupDashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const params = useParams();
  const groupId = params.groupId as string;
  const { selectedGroup, availableGroups, setSelectedGroup } = useGroup();
  const { user } = useAuth();

  // Set the selected group based on URL parameter
  useEffect(() => {
    if (groupId && availableGroups.length > 0 && (!selectedGroup || selectedGroup.id !== groupId)) {
      const targetGroup = availableGroups.find(g => g.id === groupId);
      if (targetGroup) {
        setSelectedGroup(targetGroup);
      }
    }
  }, [groupId, selectedGroup, availableGroups, setSelectedGroup]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!selectedGroup && availableGroups.length === 0) {
        console.warn('Dashboard loading timeout - redirecting to clubhouse');
        setLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [selectedGroup, availableGroups]);

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

  if (loadingTimeout) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Loading took too long</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">There might be an issue with loading your groups.</p>
          <Link href="/golf/clubhouse" className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition">
            Go to Clubhouse
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading group...</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            If this takes too long, try <Link href="/golf/clubhouse" className="text-[#6aaa64] underline">going to clubhouse</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top Navigation Bar */}
      <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))]">
        {/* Profile Section */}
        <NavigationAvatar 
          size="md" 
          showName={true} 
          showHandicap={true} 
          linkTo="/golf/profile" 
        />
        <div className="flex-1" />
        <div className="flex items-center justify-end">
          <BurgerMenu groupId={groupId} />
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex flex-col w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] min-h-[calc(100vh-4rem)] p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">{selectedGroup.name}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Group Dashboard</p>
          </div>
          <nav className="space-y-2">
            <Link href={`/golf/${groupId}/dashboard`} className="flex items-center space-x-3 px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-lg">
              <span>Dashboard</span>
            </Link>
            <Link href={`/golf/${groupId}/leaderboard`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Leaderboard</span>
            </Link>
            <Link href={`/golf/${groupId}/tournaments`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Tournaments</span>
            </Link>
            <Link href={`/golf/${groupId}/submit`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
              <span>Submit Score</span>
            </Link>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[hsl(var(--muted-foreground))]/60 z-50">
            <div className="bg-[hsl(var(--card))] w-64 min-h-screen p-4">
              <nav className="space-y-2">
                <Link href={`/golf/${groupId}/dashboard`} className="flex items-center space-x-3 px-4 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-lg">
                  <span>Dashboard</span>
                </Link>
                <Link href={`/golf/${groupId}/leaderboard`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Leaderboard</span>
                </Link>
                <Link href={`/golf/${groupId}/tournaments`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Tournaments</span>
                </Link>
                <Link href={`/golf/${groupId}/submit`} className="flex items-center space-x-3 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg">
                  <span>Submit Score</span>
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-2 md:p-4 overflow-x-hidden">
          <div className="max-w-4xl mx-auto w-full">
            <WordleHeader label="DASHBOARD" />

            {/* Group Info Banner */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-4 md:p-6 shadow-md mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-[hsl(var(--foreground))] mb-2 truncate">{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p className="text-[hsl(var(--muted-foreground))] text-sm md:text-base">{selectedGroup.description}</p>
                  )}
                </div>
                <Link 
                  href="/golf/clubhouse" 
                  className="bg-[#6aaa64] text-white px-3 md:px-4 py-2 rounded-lg hover:bg-[#599a5b] transition font-semibold text-sm md:text-base whitespace-nowrap"
                >
                  Switch Groups
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
              <Link href={`/golf/${groupId}/submit`} className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Submit Score</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Record today's Wordle result</p>
              </Link>
              
              <Link href={`/golf/${groupId}/leaderboard`} className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Leaderboard</h3>
                <p className="text-[hsl(var(--muted-foreground))]">View group rankings</p>
              </Link>
              
              <Link href={`/golf/${groupId}/tournaments`} className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-3xl mb-4">🎂</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Tournaments</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Birthday tournaments</p>
              </Link>
              
              <Link href="/golf/profile" className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-3xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Player Card</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Manage your profile</p>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">⛳</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">USGA Golf Scoring</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Convert Wordle attempts to authentic golf scores with eagles, birdies, and bogeys</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Major Tournaments</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Four annual championships matching real golf majors with cuts and leaderboards</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">🎂</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Birthday Tournaments</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Personal celebration tournaments with stroke advantages for birthday players</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Handicap System</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Fair competition with automatic USGA-style handicap calculations</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Family Groups</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Private family competitions with secure invite codes</p>
              </div>
              <div className="bg-[hsl(var(--card))] p-4 md:p-6 rounded-lg shadow-md">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Easy Score Entry</h3>
                <p className="text-[hsl(var(--muted-foreground))]">Quick score submission with easy online upload</p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-4 md:p-8 shadow-md mb-8 md:mb-12">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 text-center">How It Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Enter your attempts (1-6)</p>
                </div>
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Get Golf Score</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Converted to golf scoring</p>
                </div>
                <div className="text-center">
                  <div className="bg-[hsl(var(--muted))] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6aaa64] font-bold">4</span>
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Compete</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Track progress on leaderboards</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 