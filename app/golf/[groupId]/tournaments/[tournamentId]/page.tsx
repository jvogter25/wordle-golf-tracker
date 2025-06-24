"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowLeft } from 'lucide-react';
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

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  tournament_type: string;
  birthday_user_id?: string;
  birthday_user_name?: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface TournamentScore {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_score: number;
  rounds_played: number;
  average_score: number;
}

export default function TournamentDetailsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<TournamentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const groupId = params.groupId as string;
  const tournamentId = params.tournamentId as string;
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
    const fetchTournamentDetails = async () => {
      if (!selectedGroup || !tournamentId) return;
      
      setLoading(true);
      console.log('Fetching tournament details for:', tournamentId);
      
      // Fetch tournament info
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          start_date,
          end_date,
          tournament_type,
          birthday_user_id,
          profiles!tournaments_birthday_user_id_fkey (
            display_name
          )
        `)
        .eq('id', tournamentId)
        .eq('group_id', selectedGroup.id)
        .single();

      if (tournamentError) {
        console.error('Error fetching tournament:', tournamentError);
        setLoading(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(tournamentData.start_date);
      const endDate = new Date(tournamentData.end_date);
      
      let status: 'upcoming' | 'active' | 'completed';
      if (now < startDate) {
        status = 'upcoming';
      } else if (now >= startDate && now <= endDate) {
        status = 'active';
      } else {
        status = 'completed';
      }

      const processedTournament: Tournament = {
        id: tournamentData.id,
        name: tournamentData.name,
        start_date: tournamentData.start_date,
        end_date: tournamentData.end_date,
        tournament_type: tournamentData.tournament_type,
        birthday_user_id: tournamentData.birthday_user_id,
        birthday_user_name: (tournamentData.profiles as any)?.display_name,
        status
      };

      setTournament(processedTournament);

      // Fetch tournament scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select(`
          user_id,
          raw_score,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', selectedGroup.id)
        .gte('puzzle_date', tournamentData.start_date)
        .lte('puzzle_date', tournamentData.end_date);

      if (scoresError) {
        console.error('Error fetching tournament scores:', scoresError);
        setLeaderboard([]);
      } else {
        // Group scores by user and calculate totals
        const userScores = new Map<string, {
          user_id: string;
          display_name: string;
          avatar_url?: string;
          total_score: number;
          rounds_played: number;
        }>();

        scoresData?.forEach(score => {
          const userId = score.user_id;
          const userName = (score.profiles as any)?.display_name || 'Unknown';
          const avatarUrl = (score.profiles as any)?.avatar_url;
          
          if (!userScores.has(userId)) {
            userScores.set(userId, {
              user_id: userId,
              display_name: userName,
              avatar_url: avatarUrl,
              total_score: 0,
              rounds_played: 0
            });
          }
          
          const userScore = userScores.get(userId)!;
          userScore.total_score += score.raw_score;
          userScore.rounds_played += 1;
        });

        const leaderboardData: TournamentScore[] = Array.from(userScores.values())
          .map(user => ({
            ...user,
            average_score: user.rounds_played > 0 ? user.total_score / user.rounds_played : 0
          }))
          .sort((a, b) => a.total_score - b.total_score);

        console.log('Tournament leaderboard:', leaderboardData);
        setLeaderboard(leaderboardData);
      }
      
      setLoading(false);
    };
    
    if (selectedGroup && tournamentId) {
      fetchTournamentDetails();
    }
  }, [supabase, selectedGroup, tournamentId]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            🟢 Active
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            🔵 Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            ⚪ Completed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <NavigationAvatar size="md" linkTo="/golf/profile" />
          <div className="flex-1 flex justify-center">
            <Link href={`/golf/${groupId}/tournaments`} className="flex items-center gap-2 bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">
              <ArrowLeft size={16} />
              Back to Tournaments
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu groupId={groupId} />
          </div>
        </nav>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--muted-foreground))]">Loading tournament...</p>
          </div>
        ) : !tournament ? (
          <div className="bg-[hsl(var(--card))] rounded-lg p-8 text-center border border-[hsl(var(--border))]">
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Tournament Not Found</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">The tournament you're looking for doesn't exist.</p>
            <Link 
              href={`/golf/${groupId}/tournaments`}
              className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg hover:bg-[#599a5b] transition font-semibold"
            >
              Back to Tournaments
            </Link>
          </div>
        ) : (
          <>
            <WordleHeader label="TOURNAMENT" />
            
            {/* Tournament Info */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 mb-6 border border-[hsl(var(--border))]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      {tournament.name}
                    </h1>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="space-y-2 text-[hsl(var(--muted-foreground))]">
                    <p className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}</span>
                    </p>
                    {tournament.tournament_type === 'birthday' && tournament.birthday_user_name && (
                      <p className="flex items-center gap-2">
                        <span>🎂</span>
                        <span>{tournament.birthday_user_name}'s Birthday Tournament</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <span>👥</span>
                      <span>{selectedGroup.name}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {tournament.tournament_type === 'birthday' && (
                <div className="bg-[hsl(var(--muted))] rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎂</span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">Birthday Tournament Rules</span>
                  </div>
                  <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                    <li>• Birthday player gets -0.5 stroke advantage Monday-Thursday</li>
                    <li>• Tournament runs for 7 days starting on birthday</li>
                    <li>• All group members automatically participate</li>
                    <li>• Lowest total score wins</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Tournament Leaderboard */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Tournament Leaderboard</h2>
              
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏌️</div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No Scores Yet</h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">
                    Be the first to submit a score for this tournament!
                  </p>
                  {tournament.status === 'active' && (
                    <Link 
                      href={`/golf/${groupId}/submit`}
                      className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg hover:bg-[#599a5b] transition font-semibold"
                    >
                      Submit Score
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center py-2 px-3 font-bold text-[hsl(var(--muted-foreground))] text-sm border-b border-[hsl(var(--border))]">
                    <div className="w-12 text-left">Pos</div>
                    <div className="flex-1 text-left">Player</div>
                    <div className="w-20 text-center">Rounds</div>
                    <div className="w-20 text-center">Total</div>
                    <div className="w-20 text-center">Avg</div>
                  </div>
                  {leaderboard.map((player, idx) => {
                    const pos = idx + 1;
                    const isWinner = pos === 1 && tournament.status === 'completed';
                    const nameClass = pos <= 3 ? 'text-[#6aaa64] font-semibold' : 'text-[hsl(var(--foreground))]';
                    
                    return (
                      <div key={player.user_id} className={`flex items-center py-3 px-3 rounded-lg ${
                        isWinner ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-[hsl(var(--muted))]'
                      }`}>
                        <div className="w-12 text-left">
                          <span className="font-bold text-lg">
                            {pos === 1 && tournament.status === 'completed' ? '🏆' : pos}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center">
                          <UserAvatar 
                            avatarUrl={player.avatar_url}
                            displayName={player.display_name}
                            size="sm"
                            className="border border-[hsl(var(--primary))] mr-3"
                          />
                          <span className={`${nameClass}`}>{player.display_name}</span>
                        </div>
                        <div className="w-20 text-center font-semibold">{player.rounds_played}</div>
                        <div className="w-20 text-center font-bold text-lg">{player.total_score}</div>
                        <div className="w-20 text-center text-sm text-[hsl(var(--muted-foreground))]">
                          {player.average_score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {tournament.status === 'active' && (
              <div className="mt-6 text-center">
                <Link 
                  href={`/golf/${groupId}/submit`}
                  className="bg-[#6aaa64] text-white px-8 py-3 rounded-lg hover:bg-[#599a5b] transition font-semibold text-lg"
                >
                  Submit Today's Score
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 