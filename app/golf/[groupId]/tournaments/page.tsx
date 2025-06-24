"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useGroup } from '../../../../contexts/GroupContext';
import { useAuth } from '../../../../contexts/AuthContext';
import NavigationAvatar from '../../../../components/NavigationAvatar';
import { 
  getActiveTournaments, 
  getUpcomingTournaments, 
  getPastTournaments 
} from '@/lib/tournaments';

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
  birthday_advantage?: number;
  is_active: boolean;
  profiles?: {
    display_name: string;
  };
}

export default function GroupTournamentsPage() {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [pastTournaments, setPastTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchTournaments = async () => {
      if (!selectedGroup) return;
      
      setLoading(true);
      console.log('Fetching tournaments for group:', selectedGroup.id);
      
      try {
        const [activeData, upcomingData, pastData] = await Promise.all([
          getActiveTournaments(supabase, selectedGroup.id),
          getUpcomingTournaments(supabase, selectedGroup.id),
          getPastTournaments(supabase, selectedGroup.id)
        ]);

        setActiveTournaments(activeData || []);
        setUpcomingTournaments(upcomingData || []);
        setPastTournaments(pastData || []);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setActiveTournaments([]);
        setUpcomingTournaments([]);
        setPastTournaments([]);
      }
      
      setLoading(false);
    };
    
    if (selectedGroup) {
      fetchTournaments();
    }
  }, [supabase, selectedGroup]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Link href={`/golf/${groupId}/tournaments/${tournament.id}`}>
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">{tournament.name}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            tournament.tournament_type === 'birthday' 
              ? 'bg-pink-100 text-pink-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {tournament.tournament_type === 'birthday' ? '🎂 Birthday' : '🏆 Major'}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
          <p>📅 {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}</p>
          
          {tournament.tournament_type === 'birthday' && tournament.profiles && (
            <p>🎉 {tournament.profiles.display_name}'s Birthday Week</p>
          )}
          
          {tournament.tournament_type === 'birthday' && tournament.birthday_advantage && (
            <p>⭐ -{tournament.birthday_advantage} stroke advantage (Monday only)</p>
          )}
        </div>
      </div>
    </Link>
  );

  const TournamentSection = ({ 
    title, 
    tournaments, 
    emptyMessage 
  }: { 
    title: string; 
    tournaments: Tournament[]; 
    emptyMessage: string;
  }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">{title}</h2>
      {tournaments.length === 0 ? (
        <p className="text-[hsl(var(--muted-foreground))] italic bg-[hsl(var(--muted))] p-4 rounded-lg">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/golf/${groupId}/dashboard`} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NavigationAvatar />
            <BurgerMenu groupId={groupId} />
          </div>
        </div>

        <WordleHeader label="TOURNAMENTS" />

        {/* Group info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
            {selectedGroup.name} Tournaments
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            View and participate in group tournaments
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--muted-foreground))]">Loading tournaments...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <TournamentSection
              title="🔴 Active Tournaments"
              tournaments={activeTournaments}
              emptyMessage="No active tournaments at the moment"
            />

            <TournamentSection
              title="🔵 Upcoming Tournaments"
              tournaments={upcomingTournaments}
              emptyMessage="No upcoming tournaments scheduled"
            />

            <TournamentSection
              title="⚫ Past Tournaments"
              tournaments={pastTournaments}
              emptyMessage="No past tournaments found"
            />
          </div>
        )}

        {/* Admin link for group admins */}
        <div className="mt-12 text-center">
          <Link 
            href={`/golf/${groupId}/admin/tournaments`}
            className="inline-flex items-center gap-2 bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition"
          >
            ⚙️ Tournament Administration
          </Link>
        </div>
      </div>
    </div>
  );
} 