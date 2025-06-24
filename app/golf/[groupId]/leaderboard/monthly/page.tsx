"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGroup } from '../../../../../contexts/GroupContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import NavigationAvatar from '../../../../../components/NavigationAvatar';
import UserAvatar from '../../../../../components/UserAvatar';

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

export default function MonthlyLeaderboardPage() {
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const [currentYear, setCurrentYear] = useState('');
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
    const fetchMonthlyLeaderboard = async () => {
      if (!selectedGroup) return;
      
      setLoading(true);
      console.log('Fetching monthly leaderboard for group:', selectedGroup.id);
      
      // Set current month and year
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentMonthName(monthNames[now.getMonth()]);
      setCurrentYear(now.getFullYear().toString());
      
      // Fetch monthly leaderboard with total scores for this group
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      console.log(`Fetching monthly leaderboard for ${year}-${month} and group ${selectedGroup.id}...`);
      
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const { data: monthlyScores, error: monthlyError } = await supabase
        .from('scores')
        .select(`
          user_id,
          raw_score,
          attempts,
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
        .order('puzzle_date', { ascending: true });

      if (monthlyError) {
        console.error('Error fetching monthly scores:', monthlyError);
        setMonthly([]);
      } else {
        // Group by user and calculate total golf scores (relative to par)
        const userTotals = new Map();
        
        monthlyScores?.forEach(score => {
          const userId = score.user_id;
          const userName = (score.profiles as any)?.display_name || 'Unknown';
          const avatarUrl = (score.profiles as any)?.avatar_url;
          
          if (!userTotals.has(userId)) {
            userTotals.set(userId, {
              id: userId,
              display_name: userName,
              avatar_url: avatarUrl,
              totalScore: 0,
              gamesPlayed: 0,
              scores: []
            });
          }
          
          const userData = userTotals.get(userId);
          // Calculate golf score (relative to par of 4)
          const golfScore = (score.raw_score || 4) - 4;
          userData.totalScore += golfScore;
          userData.gamesPlayed += 1;
          userData.scores.push({
            date: score.puzzle_date,
            golf_score: golfScore,
            attempts: score.raw_score
          });
        });
        
        const monthlyData = Array.from(userTotals.values())
          .filter(player => player.gamesPlayed > 0)
          .sort((a, b) => a.totalScore - b.totalScore); // Lowest total raw score wins
        
        console.log('Monthly leaderboard data:', monthlyData);
        setMonthly(monthlyData);
      }
      
      setLoading(false);
    };
    
    if (selectedGroup) {
      fetchMonthlyLeaderboard();
    }
  }, [supabase, selectedGroup]);

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
            <Link 
              href={`/golf/${groupId}/leaderboard`} 
              className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Leaderboard
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu groupId={groupId} />
          </div>
        </nav>

        <WordleHeader label="MONTHLY" />
        
        {/* Group Info */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{selectedGroup.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{currentMonthName} {currentYear} Leaderboard</p>
            </div>
            <Link 
              href="/golf/clubhouse" 
              className="text-[#6aaa64] hover:text-[#599a5b] font-semibold text-sm"
            >
              Switch Groups
            </Link>
          </div>
        </div>

        {/* Full Monthly Leaderboard */}
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-[hsl(var(--border))]">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">{currentMonthName} {currentYear} Final Standings</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
              <p className="text-[hsl(var(--muted-foreground))]">Loading leaderboard...</p>
            </div>
          ) : monthly.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏌️</div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No scores this month</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">Be the first to submit a score!</p>
              <Link
                href={`/golf/${groupId}/submit`}
                className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition"
              >
                Submit Score
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center py-2 px-4 font-bold text-[hsl(var(--muted-foreground))] text-sm border-b border-[hsl(var(--border))]">
                <div className="w-12 text-left">Pos</div>
                <div className="flex-1 text-left">Player</div>
                <div className="w-20 text-center">Games</div>
                <div className="w-20 text-right">Total</div>
              </div>
              
              {/* Leaderboard entries */}
              {monthly.map((player, idx) => {
                const pos = idx + 1;
                const nameClass = idx < 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                const isCurrentUser = player.id === user?.id;
                
                return (
                  <div 
                    key={player.id} 
                    className={`flex items-center py-4 px-4 rounded-xl shadow-sm ${
                      isCurrentUser 
                        ? 'bg-[#6aaa64]/10 border-2 border-[#6aaa64]/30' 
                        : 'bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <div className="w-12 text-left">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {pos}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center">
                      <Link href={isCurrentUser ? "/golf/profile" : `/golf/player?userId=${player.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                        <UserAvatar 
                          avatarUrl={player.avatar_url}
                          displayName={player.display_name}
                          size="md"
                          className="border-2 border-[hsl(var(--primary))] mr-3"
                        />
                        <div className="flex flex-col justify-center">
                          <span className={`text-base md:text-lg ${nameClass} hover:underline`} style={{lineHeight: '1.1'}}>
                            {player.display_name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-[#6aaa64] font-semibold mt-0.5">You</span>
                          )}
                        </div>
                      </Link>
                    </div>
                    <div className="w-20 text-center">
                      <span className="text-sm font-semibold">{player.gamesPlayed}</span>
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-lg font-bold">{formatScore(player.totalScore)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Link 
            href={`/golf/${groupId}/leaderboard`}
            className="text-[#6aaa64] hover:text-[#599a5b] font-semibold"
          >
            ← Back to Main Leaderboard
          </Link>
          <Link 
            href={`/golf/${groupId}/submit`}
            className="text-[#6aaa64] hover:text-[#599a5b] font-semibold"
          >
            Submit Score →
          </Link>
        </div>
      </div>
    </div>
  );
} 
