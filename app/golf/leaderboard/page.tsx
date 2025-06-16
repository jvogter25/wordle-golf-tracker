"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

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

const scoreToEmoji = {
  1: '⛳️',
  2: '🦅',
  3: '🐦‍⬛',
  4: '🏌️',
  5: '😬',
  6: '😱',
  7: '❌',
};

export default function LeaderboardPage() {
  const [allTime, setAllTime] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);
      console.log('Fetching leaderboards...');
      
      // Set current month name
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentMonthName(monthNames[now.getMonth()]);
      
      // Fetch all-time leaderboard
      const { data: allTimeData, error: allTimeError } = await supabase.rpc('get_all_time_leaderboard');
      if (allTimeError) {
        console.error('Error fetching all-time leaderboard:', allTimeError);
      } else {
        console.log('All-time leaderboard data:', allTimeData);
      }
      setAllTime(allTimeData || []);

      // Fetch monthly leaderboard with total scores instead of average
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      console.log(`Fetching monthly leaderboard for ${year}-${month}...`);
      
      // Get monthly total scores directly from scores table
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
      
      const { data: monthlyScores, error: monthlyError } = await supabase
        .from('scores')
        .select(`
          user_id,
          raw_score,
          profiles (
            id,
            display_name
          )
        `)
        .gte('puzzle_date', startDate)
        .lte('puzzle_date', endDate);

      if (monthlyError) {
        console.error('Error fetching monthly scores:', monthlyError);
        setMonthly([]);
      } else {
        // Group by user and calculate total scores
        const userTotals = new Map();
        
        monthlyScores?.forEach(score => {
          const userId = score.user_id;
          const userName = (score.profiles as any)?.display_name || 'Unknown';
          
          if (!userTotals.has(userId)) {
            userTotals.set(userId, {
              id: userId,
              display_name: userName,
              score: 0
            });
          }
          
          userTotals.get(userId).score += score.raw_score;
        });
        
        // Convert to array and sort by total score
        const monthlyData = Array.from(userTotals.values())
          .sort((a, b) => a.score - b.score);
        
        console.log('Monthly leaderboard data:', monthlyData);
        setMonthly(monthlyData);
      }
      
      setLoading(false);
    };
    fetchLeaderboards();
  }, [supabase]);

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
            <div className="flex items-center py-2 px-2 font-bold text-[hsl(var(--muted-foreground))] text-xs md:text-sm">
              <div className="w-10 text-left">Pos</div>
              <div className="flex-1 text-left pl-2">Name</div>
              <div className="w-16 text-right">Today</div>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              allTime.map((player, idx) => {
                let pos: string = String(idx + 1);
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                return (
                  <div key={player.id} className="flex items-center py-4 px-2 bg-[hsl(var(--muted))] rounded-xl my-2 shadow-sm">
                    <div className="w-10 text-left font-bold text-base md:text-lg">{pos}</div>
                    <div className="flex-1 flex items-center pl-2">
                      <img src={player.avatar_url || '/golf/jake-avatar.jpg'} alt={player.display_name} className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary))] mr-2" />
                      <div className="flex flex-col justify-center">
                        <span className={`truncate text-base md:text-lg ${nameClass} mb-0.5`} style={{lineHeight: '1.1'}}>{player.display_name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">HCP {Number(player.handicap).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right text-2xl">{scoreToEmoji[player.today]}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Monthly Leaderboard - {currentMonthName}</h2>
          <table className="w-full text-left mb-2 cursor-pointer" onClick={() => window.location.href = '/golf/leaderboard/monthly'}>
            <thead>
              <tr>
                <th className="py-1">Pos</th>
                <th className="py-1">Name</th>
                <th className="py-1">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4">Loading...</td></tr>
              ) : (
                monthly.map((player, idx) => (
                  <tr key={player.id}>
                    <td className="py-1">{idx + 1}</td>
                    <td className="py-1">{player.display_name}</td>
                    <td className="py-1">{player.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 