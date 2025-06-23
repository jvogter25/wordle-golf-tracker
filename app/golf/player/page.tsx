"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserGroups } from '../../../lib/groups';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../src/types/supabase';
import Navigation from '../../../components/Navigation';

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

export default function PlayerPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [handicap, setHandicap] = useState(0);
  const [groups, setGroups] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    console.log('🔄 useEffect triggered, user:', user?.email || 'null');
    if (user) {
      fetchPlayerData();
    }
  }, [user]);

  const fetchPlayerData = async () => {
    try {
      console.log('🔍 Starting fetchPlayerData...');
      
      // Fetch profile
      console.log('📋 Fetching profile data...');
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileData) {
        console.log('✅ Profile data loaded successfully');
        setProfile(profileData);
      } else {
        console.log('⚠️ No profile data found');
      }

      // Fetch handicap from all-time leaderboard function
      console.log('🏌️ Fetching handicap data via RPC...');
      const { data: leaderboardData, error: handicapError } = await supabase.rpc('get_all_time_leaderboard');
      if (!handicapError && leaderboardData) {
        console.log('✅ Handicap RPC completed successfully');
        const userHandicap = leaderboardData.find((player: any) => player.id === user?.id);
        if (userHandicap) {
          console.log('✅ User handicap found:', userHandicap.handicap);
          setHandicap(userHandicap.handicap || 0);
        } else {
          console.log('⚠️ User not found in handicap data');
        }
      } else {
        console.log('❌ Handicap RPC failed:', handicapError);
      }

      // Fetch groups
      console.log('👥 Fetching groups data...');
      const groupsData = await getUserGroups(supabase);
      console.log('✅ Groups data loaded:', groupsData?.length || 0, 'groups');
      setGroups(groupsData || []);

      // Fetch basic stats
      console.log('📊 Fetching scores for stats...');
      const { data: scoresData } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user?.id);

      if (scoresData) {
        console.log('✅ Scores data loaded:', scoresData.length, 'scores');
        const totalScores = scoresData.length;
        const avgScore = totalScores > 0 ? scoresData.reduce((sum, score) => sum + score.raw_score, 0) / totalScores : 0;
        const holeInOnes = scoresData.filter(s => s.raw_score === 1).length;
        const eagles = scoresData.filter(s => s.raw_score === 2).length;
        const birdies = scoresData.filter(s => s.raw_score === 3).length;
        const pars = scoresData.filter(s => s.raw_score === 4).length;
        const bogeys = scoresData.filter(s => s.raw_score === 5).length;
        const doubleBogeys = scoresData.filter(s => s.raw_score === 6).length;
        const failed = scoresData.filter(s => s.raw_score === 7).length;

        setStats({
          totalScores,
          avgScore: avgScore.toFixed(2),
          holeInOnes,
          eagles,
          birdies,
          pars,
          bogeys,
          doubleBogeys,
          failed
        });
        console.log('✅ Stats calculated successfully');
      } else {
        console.log('⚠️ No scores data found');
      }
      
      console.log('🎉 fetchPlayerData completed successfully');
    } catch (error) {
      console.error('❌ Error in fetchPlayerData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Use the new Navigation component with global context */}
        <Navigation 
          context="global" 
          centerLink={{
            href: "/golf/homepage",
            label: "Home"
          }}
        />

        <WordleHeader label="PLAYER CARD" />

        {/* Profile Section */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#6aaa64] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {profile?.display_name || user?.email}
              </h2>
              <p className="text-[hsl(var(--muted-foreground))]">
                Handicap: {handicap > 0 ? `+${handicap.toFixed(1)}` : handicap.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6aaa64]">{stats.totalScores}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Total Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6aaa64]">{stats.avgScore}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#c9b458]">{stats.eagles}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Eagles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6aaa64]">{stats.birdies}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Birdies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#787c7e]">{stats.pars}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Pars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#787c7e]">{stats.bogeys}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Bogeys</div>
              </div>
            </div>
          </div>
        )}

        {/* Groups Section */}
        <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">Your Groups</h3>
          {groups.length > 0 ? (
            <div className="grid gap-3">
              {groups.map((group: any) => (
                <div key={group.id} className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-lg">
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--foreground))]">{group.name}</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Code: {group.invite_code}</p>
                  </div>
                  <Link
                    href={`/golf/${group.id}/dashboard`}
                    className="bg-[#6aaa64] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition"
                  >
                    Enter
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">You haven't joined any groups yet.</p>
              <Link
                href="/golf/clubhouse"
                className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#599a5b] transition"
              >
                Join a Group
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 