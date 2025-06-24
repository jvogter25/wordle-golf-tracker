"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGroup } from '../../../../contexts/GroupContext';
import { useAuth } from '../../../../contexts/AuthContext';
import NavigationAvatar from '../../../../components/NavigationAvatar';
import UserAvatar from '../../../../components/UserAvatar';
import { getTodaysPSTDateString } from '@/lib/wordle-utils';

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
        className="p-2 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-md"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation menu"
      >
        {open ? <X size={28} /> : <Menu size={28} />}
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

const scoreToEmoji = {
  1: '⛳️',
  2: '🦅',
  3: '🐦‍⬛',
  4: '🏌️',
  5: '😬',
  6: '😱',
  7: '❌',
};

// Helper function to convert score to emoji
const getScoreEmoji = (score: number | null): string => {
  if (!score) return '🏌️'; // Default to par if no score
  return scoreToEmoji[score as keyof typeof scoreToEmoji] || '🏌️';
};

export default function GroupLeaderboardPage() {
  const [allTime, setAllTime] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const params = useParams();
  const groupId = params.groupId as string;
  const { selectedGroup, availableGroups, setSelectedGroup } = useGroup();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Set the selected group based on URL parameter
  useEffect(() => {
    if (groupId && availableGroups.length > 0 && (!selectedGroup || selectedGroup.id !== groupId)) {
      const targetGroup = availableGroups.find(g => g.id === groupId);
      if (targetGroup) {
        setSelectedGroup(targetGroup);
      }
    }
  }, [groupId, selectedGroup, availableGroups, setSelectedGroup]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      if (!selectedGroup) return;
      
      setLoading(true);
      console.log('Fetching leaderboards for group:', selectedGroup.id);
      
      // Set current month name
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentMonthName(monthNames[now.getMonth()]);
      
      // Fetch all-time leaderboard for this group - get total scores instead of handicap
      const { data: allScores, error: allScoresError } = await supabase
        .from('scores')
        .select(`
          user_id,
          raw_score,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', selectedGroup.id);

      // Also fetch handicap data for display under names
      const { data: allTimeData, error: allTimeError } = await supabase.rpc('get_all_time_leaderboard');

      if (allScoresError || allTimeError) {
        console.error('Error fetching all-time leaderboard:', allScoresError || allTimeError);
      } else {
        // Calculate total scores for each user
        const userTotals = new Map();
        
        allScores?.forEach(score => {
          const userId = score.user_id;
          const userName = (score.profiles as any)?.display_name || 'Unknown';
          const avatarUrl = (score.profiles as any)?.avatar_url;
          
          if (!userTotals.has(userId)) {
            userTotals.set(userId, {
              id: userId,
              display_name: userName,
              avatar_url: avatarUrl,
              totalScore: 0,
              gamesPlayed: 0
            });
          }
          
          const userData = userTotals.get(userId);
          // Calculate golf score (relative to par of 4)
          const golfScore = (score.raw_score || 4) - 4;
          userData.totalScore += golfScore;
          userData.gamesPlayed += 1;
        });

        // Merge with handicap data
        const allTimeWithTotals = Array.from(userTotals.values())
          .map(user => {
            const handicapData = allTimeData?.find(p => p.id === user.id);
            return {
              ...user,
              handicap: handicapData?.handicap || 0,
              today: handicapData?.today || null
            };
          })
          .filter(player => player.gamesPlayed > 0)
          .sort((a, b) => a.totalScore - b.totalScore);
        
        console.log('All-time leaderboard data with totals:', allTimeWithTotals);
        setAllTime(allTimeWithTotals);
      }

      // Fetch monthly leaderboard - get today's scores for current month instead of totals
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const today = getTodaysPSTDateString(); // Use PST date instead of UTC
      console.log(`Fetching monthly leaderboard for ${year}-${month} and group ${selectedGroup.id}...`);
      
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      // Get today's scores for users in this month
      const { data: monthlyScores, error: monthlyError } = await supabase
        .from('scores')
        .select(`
          user_id,
          raw_score,
          puzzle_date,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', selectedGroup.id)
        .gte('puzzle_date', startDate)
        .lte('puzzle_date', endDate)
        .eq('puzzle_date', today); // Only get today's scores

      if (monthlyError) {
        console.error('Error fetching monthly scores:', monthlyError);
        setMonthly([]);
      } else {
        // Process today's scores for display and sort by performance (best score first)
        const todayScores = monthlyScores?.map(score => ({
          id: score.user_id,
          display_name: (score.profiles as any)?.display_name || 'Unknown',
          avatar_url: (score.profiles as any)?.avatar_url,
          todayScore: score.raw_score // This will be the number of attempts (1-7)
        })).sort((a, b) => a.todayScore - b.todayScore) || []; // Sort by best performance
        
        console.log('Today\'s scores for monthly leaderboard:', todayScores);
        setMonthly(todayScores);
      }
      
      setLoading(false);
    };
    
    if (selectedGroup) {
      fetchLeaderboards();
    }
  }, [selectedGroup]);

  const formatScore = (score: number): string => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : score.toString();
  };

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

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <NavigationAvatar size="md" linkTo="/golf/profile" />
          <div className="flex-1 flex justify-center">
            <Link href={`/golf/${groupId}/dashboard`} className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">Dashboard</Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu groupId={groupId} />
          </div>
        </nav>

        <WordleHeader label="LEADERBOARD" />
        
        {/* Group Info */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{selectedGroup.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Group Leaderboard</p>
            </div>
            <Link 
              href="/golf/clubhouse" 
              className="text-[#6aaa64] hover:text-[#599a5b] font-semibold text-sm"
            >
              Switch Groups
            </Link>
          </div>
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">All Time Leaderboard</h2>
          <div className="divide-y divide-[hsl(var(--border))]">
            <div className="flex items-center py-2 px-2 font-bold text-[hsl(var(--muted-foreground))] text-xs md:text-sm">
              <div className="w-10 text-left">Pos</div>
              <div className="flex-1 text-left pl-2">Name</div>
              <div className="w-16 text-right">Score</div>
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
                      <Link href={player.id === user?.id ? "/golf/profile" : `/golf/player?userId=${player.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                        <UserAvatar 
                          avatarUrl={player.avatar_url}
                          displayName={player.display_name}
                          size="md"
                          className="border-2 border-[hsl(var(--primary))] mr-2"
                        />
                        <div className="flex flex-col justify-center">
                          <span className={`truncate text-base md:text-lg ${nameClass} mb-0.5 hover:underline`} style={{lineHeight: '1.1'}}>{player.display_name}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">HCP {Number(player.handicap).toFixed(1)}</span>
                        </div>
                      </Link>
                    </div>
                    <div className="w-16 text-right text-lg font-bold">{formatScore(player.totalScore)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Scores */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Today's Scores</h2>
            <Link href={`/golf/${groupId}/leaderboard/monthly`} className="text-[#6aaa64] hover:text-[#599a5b] font-semibold text-sm">
              View {currentMonthName} →
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : monthly.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[hsl(var(--muted-foreground))]">No scores today yet.</p>
              </div>
            ) : (
              monthly.map((player, idx) => { // Removed .slice(0, 5) to show all scores
                const pos = idx + 1;
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                return (
                  <div key={player.id} className="flex items-center py-3 px-2 bg-[hsl(var(--muted))] rounded-lg">
                    <div className="w-8 text-left font-bold text-sm">{pos}</div>
                    <div className="flex-1 flex items-center pl-2">
                      <Link href={player.id === user?.id ? "/golf/profile" : `/golf/player?userId=${player.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                        <UserAvatar 
                          avatarUrl={player.avatar_url}
                          displayName={player.display_name}
                          size="sm"
                          className="border border-[hsl(var(--primary))] mr-2"
                        />
                        <span className={`text-sm ${nameClass} hover:underline`}>{player.display_name}</span>
                      </Link>
                    </div>
                    <div className="w-12 text-right text-xl">{getScoreEmoji(player.todayScore)}</div>
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