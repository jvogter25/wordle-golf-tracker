"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

function WordleHeader({ label }: { label: string }) {
  const colors = ['bg-[#6aaa64]', 'bg-[#c9b458]', 'bg-[#787c7e]'];
  return (
    <div className="flex justify-center gap-1 mb-2">
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

export default function MonthlyLeaderboardPage() {
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  useEffect(() => {
    const fetchMonthly = async () => {
      setLoading(true);
      const month = now.getMonth() + 1;
      const { data: monthlyData } = await supabase.rpc('get_monthly_leaderboard', { year, month });
      setMonthly(monthlyData || []);
      setLoading(false);
    };
    fetchMonthly();
  }, [supabase, year, now]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2">
          <WordleHeader label="LEADERBOARD" />
          <WordleHeader label={monthName.toUpperCase()} />
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Monthly Leaderboard</h2>
          <div className="divide-y divide-[hsl(var(--border))]">
            <div className="flex items-center py-2 px-2 font-bold text-[hsl(var(--muted-foreground))] text-xs md:text-sm">
              <div className="w-10 text-left">Pos</div>
              <div className="flex-1 text-left pl-2">Name</div>
              <div className="w-16 text-right">Score</div>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              monthly.map((player, idx) => {
                let pos: string = String(idx + 1);
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                return (
                  <div key={player.id} className="flex items-center py-4 px-2 bg-[hsl(var(--muted))] rounded-xl my-2 shadow-sm">
                    <div className="w-10 text-left font-bold text-base md:text-lg">{pos}</div>
                    <div className="flex-1 flex items-center pl-2">
                      <img src={player.avatar_url || '/golf/jake-avatar.jpg'} alt={player.display_name} className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary))] mr-2" />
                      <div className="flex flex-col justify-center">
                        <span className={`truncate text-base md:text-lg ${nameClass} mb-0.5`} style={{lineHeight: '1.1'}}>{player.display_name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">HCP {player.handicap}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right text-2xl">{player.score}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="text-center">
          <Link href="/golf/leaderboard" className="text-primary-500 hover:text-primary-600">← Back to Leaderboard</Link>
        </div>
      </div>
    </div>
  );
} 