"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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

export default function TournamentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDates, setTournamentDates] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const params = useParams();
  const tournamentId = params?.tournamentId;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      // Fetch tournament info
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('name, start_date, end_date')
        .eq('id', tournamentId)
        .single();
      setTournamentName(tournamentData?.name || 'Tournament');
      if (tournamentData?.start_date && tournamentData?.end_date) {
        const s = new Date(tournamentData.start_date);
        const e = new Date(tournamentData.end_date);
        const pad = n => n.toString().padStart(2, '0');
        setTournamentDates(`${pad(s.getMonth()+1)}/${pad(s.getDate())} - ${pad(e.getMonth()+1)}/${pad(e.getDate())}`);
      }
      // Fetch leaderboard
      const { data: leaderboardData } = await supabase.rpc('get_tournament_leaderboard', { tournament_id: tournamentId });
      setLeaderboard(leaderboardData || []);
      setLoading(false);
    };
    if (tournamentId) fetchLeaderboard();
  }, [supabase, tournamentId]);

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
        <div className="mb-2">
          <WordleHeader label={tournamentName.toUpperCase()} />
          <WordleHeader label="LEADERBOARD" />
          {tournamentDates && (
            <div className="text-center text-sm text-[hsl(var(--muted-foreground))] mb-4" style={{marginTop: '-1.5rem'}}>
              {tournamentDates}
            </div>
          )}
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">{tournamentName}</h2>
          <div className="divide-y divide-[hsl(var(--border))]">
            <div className="flex items-center py-2 px-2 font-bold text-[hsl(var(--muted-foreground))] text-xs md:text-sm">
              <div className="w-10 text-left">Pos</div>
              <div className="flex-1 text-left pl-2">Name</div>
              <div className="w-16 text-right">Score</div>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              leaderboard.map((player, idx) => {
                let pos: string = String(idx + 1);
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                return (
                  <div key={player.id} className="flex items-center py-4 px-2 bg-[hsl(var(--muted))] rounded-xl my-2 shadow-sm">
                    <div className="w-10 text-left font-bold text-base md:text-lg">{pos}</div>
                    <div className="flex-1 flex items-center pl-2">
                      <img src={player.avatar_url || '/golf/jake-avatar.jpg'} alt={player.display_name} className="w-8 h-8 rounded-full border-2 border-[hsl(var(--primary))] mr-2" />
                      <span className={`truncate text-base md:text-lg ${nameClass}`}>{player.display_name}</span>
                    </div>
                    <div className="w-16 text-right text-xl">{player.score}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 