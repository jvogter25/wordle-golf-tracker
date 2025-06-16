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

// Function to convert raw score to golf scoring
function formatGolfScore(score: number): string {
  const par = 4; // Assuming par 4 for Wordle (4 attempts is par)
  const difference = score - par;
  
  if (difference === 0) return 'E';
  if (difference > 0) return `+${difference}`;
  return `${difference}`;
}

export default function TournamentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDates, setTournamentDates] = useState('');
  const [tournamentType, setTournamentType] = useState('');
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const params = useParams();
  const tournamentId = params?.tournamentId;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // Fetch tournament info
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      if (tournamentError) {
        setLoading(false);
        return;
      }
      
      setTournamentData(tournament);
      setTournamentName(tournament?.name || 'Tournament');
      setTournamentType(tournament?.tournament_type || '');
      
      if (tournament?.start_date && tournament?.end_date) {
        const s = new Date(tournament.start_date);
        const e = new Date(tournament.end_date);
        const pad = n => n.toString().padStart(2, '0');
        setTournamentDates(`${pad(s.getMonth()+1)}/${pad(s.getDate())} - ${pad(e.getMonth()+1)}/${pad(e.getDate())}`);
      }
      
      // Try the SQL function first
      const { data: leaderboardData, error: leaderboardError } = await supabase.rpc('get_tournament_leaderboard', { tournament_id: tournamentId });
      
      if (leaderboardError) {
        
        // Fallback: Query scores directly
        const { data: scoresData, error: scoresError } = await supabase
          .from('scores')
          .select(`
            *,
            profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .gte('puzzle_date', tournament.start_date)
          .lte('puzzle_date', tournament.end_date);
        
        if (scoresError) {
          setLoading(false);
          return;
        }
        
        // Process scores manually
        const playerScores = new Map();
        
        scoresData?.forEach(score => {
          const userId = score.user_id;
          const profile = (score.profiles as any);
          
          if (!playerScores.has(userId)) {
            playerScores.set(userId, {
              id: userId,
              display_name: profile?.display_name || 'Unknown',
              avatar_url: profile?.avatar_url || null,
              scores: [],
              totalScore: 0,
              todayScore: null,
              weekScore: 0,
              qualifyingDays: 0,
              is_birthday_person: tournament.birthday_user_id === userId
            });
          }
          
          const player = playerScores.get(userId);
          const scoreDate = new Date(score.puzzle_date);
          const today = new Date();
          const isToday = scoreDate.toDateString() === today.toDateString();
          
          // Check if this is a qualifying round (Mon-Thu)
          const dayOfWeek = scoreDate.getDay(); // 0=Sunday, 1=Monday, etc.
          const isQualifyingDay = [1,2,3,4].includes(dayOfWeek); // Mon-Thu
          
          // Use raw score for individual day scoring
          let adjustedScore = score.raw_score;
          
          // For birthday person on qualifying days, apply advantage to individual score
          if (tournament.tournament_type === 'birthday' && 
              tournament.birthday_user_id === userId && 
              isQualifyingDay) {
            adjustedScore = Math.max(0, score.raw_score - (tournament.birthday_advantage || 0.5));
            player.qualifyingDays++;
          }
          
          player.scores.push({
            date: score.puzzle_date,
            rawScore: score.raw_score,
            adjustedScore: adjustedScore,
            isToday: isToday
          });
          
          player.weekScore += adjustedScore;
          
          if (isToday) {
            player.todayScore = adjustedScore;
          }
        });
        
        // Convert to array and sort
        const leaderboardArray = Array.from(playerScores.values())
          .filter(player => player.scores.length > 0)
          .sort((a, b) => a.weekScore - b.weekScore);
        
        setLeaderboard(leaderboardArray);
      } else {
        setLeaderboard(leaderboardData || []);
      }
      
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
          <WordleHeader label={tournamentName.replace("'s Birthday Tournament", "").toUpperCase()} />
          <WordleHeader label="BIRTHDAY" />
          <WordleHeader label="TOURNAMENT" />
          <WordleHeader label="LEADERBOARD" />
          {tournamentDates && (
            <div className="text-center text-sm text-[hsl(var(--muted-foreground))] mb-4" style={{marginTop: '-1.5rem'}}>
              {tournamentDates}
            </div>
          )}
        </div>
        
        {/* Tournament Scoring Info */}
        {tournamentType === 'birthday' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🎂</span>
              <h3 className="text-lg font-semibold text-yellow-800">Birthday Tournament Scoring</h3>
            </div>
            <div className="text-sm text-yellow-700">
              <p className="mb-1"><strong>Qualifying Rounds (Mon-Thu):</strong> Birthday person gets -0.5 stroke advantage</p>
              <p><strong>Championship Rounds (Fri-Sun):</strong> Regular scoring for everyone</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
          <div>Tournament ID: {tournamentId}</div>
          <div>Tournament Type: {tournamentType}</div>
          <div>Birthday User ID: {tournamentData?.birthday_user_id}</div>
          <div>Leaderboard Length: {leaderboard.length}</div>
          {leaderboard.length > 0 && (
            <div>
              <div>First Player: {leaderboard[0]?.display_name}</div>
              <div>Today Score: {leaderboard[0]?.todayScore}</div>
              <div>Week Score: {leaderboard[0]?.weekScore}</div>
              <div>Qualifying Days: {leaderboard[0]?.qualifyingDays}</div>
              <div>Is Birthday Person: {leaderboard[0]?.is_birthday_person ? 'Yes' : 'No'}</div>
              <div>Scores: {JSON.stringify(leaderboard[0]?.scores?.map(s => ({
                date: s.date,
                raw: s.rawScore,
                adjusted: s.adjustedScore,
                isToday: s.isToday
              })))}</div>
            </div>
          )}
        </div>

        {/* Tournament Leaderboard */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[hsl(var(--muted-foreground))]">No scores submitted yet for this tournament.</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Submit your daily Wordle score to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Header */}
              <div className="hidden md:flex items-center bg-[hsl(var(--muted))] rounded-lg p-3 font-semibold text-sm">
                <div className="w-12">Pos</div>
                <div className="flex-1 pl-4">Name</div>
                <div className="w-20 text-center">Today</div>
                <div className="w-24 text-center">This Week</div>
              </div>
              
              {leaderboard.map((player, idx) => {
                const pos = idx + 1;
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                
                return (
                  <div key={player.id} className="bg-[hsl(var(--muted))] rounded-xl p-4 shadow-sm">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#6aaa64] rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {pos}
                          </div>
                          <div className={`text-xl font-bold ${nameClass}`}>
                            {player.display_name}
                            {player.is_birthday_person && <span className="ml-2 text-lg">🎂</span>}
                          </div>
                        </div>
                        <div>
                          <img 
                            src={player.avatar_url || '/golf/jake-avatar.jpg'} 
                            alt={player.display_name} 
                            className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary))]" 
                          />
                        </div>
                      </div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))] bg-gray-50 p-2 rounded">
                        <div>Today: {player.todayScore !== null ? formatGolfScore(player.todayScore) : '-'}</div>
                        <div>This Week: {formatGolfScore(player.weekScore || player.score || 0)}</div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden md:flex md:items-center">
                      <div className="w-12 text-left font-bold text-lg">{pos}</div>
                      <div className="flex-1 flex items-center pl-4">
                        <img 
                          src={player.avatar_url || '/golf/jake-avatar.jpg'} 
                          alt={player.display_name} 
                          className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary))] mr-3" 
                        />
                        <span className={`text-lg ${nameClass}`}>
                          {player.display_name}
                          {player.is_birthday_person && <span className="ml-2">🎂</span>}
                        </span>
                      </div>
                      <div className="w-20 text-center text-lg font-semibold">
                        {player.todayScore !== null ? formatGolfScore(player.todayScore) : '-'}
                      </div>
                      <div className="w-24 text-center text-xl font-bold">
                        {formatGolfScore(player.weekScore || player.score || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 