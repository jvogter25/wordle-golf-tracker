"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Upload, User, Calendar, Trophy, Users } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../src/types/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import NavigationAvatar from '../../../components/NavigationAvatar';
import UserAvatar from '../../../components/UserAvatar';
import { uploadAvatar, removeAvatar } from '../../../lib/avatar';

const globalMenuItems = [
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
];

function BurgerMenu({ selectedGroup }: { selectedGroup: any }) {
  const [open, setOpen] = useState(false);
  
  const groupAwareLinks = selectedGroup ? [
    { href: `/golf/${selectedGroup.id}/dashboard`, label: 'Dashboard' },
    { href: `/golf/${selectedGroup.id}/leaderboard`, label: 'Leaderboard' },
    { href: `/golf/${selectedGroup.id}/tournaments`, label: 'Tournaments' },
    { href: `/golf/${selectedGroup.id}/submit`, label: 'Submit Score' },
    { href: '/golf/profile', label: 'Player Card' },
    { href: '/golf/clubhouse', label: 'Clubhouse' },
  ] : globalMenuItems;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition"
      >
        <Menu size={24} className="text-[hsl(var(--foreground))]" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 flex flex-col">
          {groupAwareLinks.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-3 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition first:rounded-t-lg last:rounded-b-lg"
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

interface ProfileData {
  display_name: string;
  email: string;
  birthday?: string;
  avatar_url?: string;
  handicap: number;
}

interface GroupStats {
  group_name: string;
  total_scores: number;
  average_score: number;
  best_score: number;
  current_streak: number;
}

export default function GlobalProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const { user, supabase } = useAuth();
  const { availableGroups, selectedGroup } = useGroup();

  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', user?.email, 'availableGroups:', availableGroups?.length);
    
    const fetchProfile = async () => {
      if (!user || !supabase) return;

      console.log('🔍 Starting profile fetch for user:', user.email);
      setLoading(true);
      
      try {
        // Fetch user profile with timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: profileData, error: profileError } = await Promise.race([
          profilePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
          )
        ]) as any;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          // Handle birthday from either format
          let birthday = profileData.birthday || '';
          
          // If no birthday string but we have month/day, construct it
          if (!birthday && profileData.birth_month && profileData.birth_day) {
            // Use current year or a default year for the date input
            const currentYear = new Date().getFullYear();
            birthday = `${currentYear}-${profileData.birth_month.toString().padStart(2, '0')}-${profileData.birth_day.toString().padStart(2, '0')}`;
          }

          setProfile({
            display_name: profileData.display_name || '',
            email: profileData.email || user.email || '',
            birthday: birthday,
            avatar_url: profileData.avatar_url || '',
            handicap: 0 // Will be updated below from leaderboard data
          });
        }

        // Fetch handicap from leaderboard function
        try {
          const { data: leaderboardData, error: handicapError } = await supabase.rpc('get_all_time_leaderboard');
          if (!handicapError && leaderboardData) {
            const userHandicap = leaderboardData.find((player: any) => player.id === user.id);
            if (userHandicap) {
              setProfile(prev => prev ? { ...prev, handicap: userHandicap.handicap || 0 } : prev);
            }
          }
        } catch (handicapError) {
          console.error('Error fetching handicap:', handicapError);
        }

        // Fetch stats for each group with timeout protection
        const statsPromises = availableGroups.map(async (group) => {
          try {
            const scoresPromise = supabase
              .from('scores')
              .select('raw_score, puzzle_date')
              .eq('user_id', user.id)
              .eq('group_id', group.id)
              .order('puzzle_date', { ascending: false });

            const { data: scoresData, error: scoresError } = await Promise.race([
              scoresPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Scores fetch timeout for group ${group.name}`)), 10000)
              )
            ]) as any;

            if (scoresError) {
              console.error(`Error fetching scores for group ${group.id}:`, scoresError);
              return {
                group_name: group.name,
                total_scores: 0,
                average_score: 0,
                best_score: 0,
                current_streak: 0
              };
            }

            if (!scoresData || scoresData.length === 0) {
              return {
                group_name: group.name,
                total_scores: 0,
                average_score: 0,
                best_score: 0,
                current_streak: 0
              };
            }

            const totalScores = scoresData.length;
            const averageScore = scoresData.reduce((sum, score) => sum + score.raw_score, 0) / totalScores;
            const bestScore = Math.min(...scoresData.map(score => score.raw_score));
            
            // Calculate current streak (consecutive days with scores)
            let currentStreak = 0;
            const today = new Date();
            const sortedScores = scoresData.sort((a, b) => new Date(b.puzzle_date).getTime() - new Date(a.puzzle_date).getTime());
            
            for (let i = 0; i < sortedScores.length; i++) {
              const scoreDate = new Date(sortedScores[i].puzzle_date);
              const expectedDate = new Date(today);
              expectedDate.setDate(today.getDate() - i);
              
              if (scoreDate.toDateString() === expectedDate.toDateString()) {
                currentStreak++;
              } else {
                break;
              }
            }

            return {
              group_name: group.name,
              total_scores: totalScores,
              average_score: Math.round(averageScore * 10) / 10,
              best_score: bestScore,
              current_streak: currentStreak
            };
          } catch (error) {
            console.error(`Error fetching stats for group ${group.name}:`, error);
            return {
              group_name: group.name,
              total_scores: 0,
              average_score: 0,
              best_score: 0,
              current_streak: 0
            };
          }
        });

        // Add overall timeout for all stats fetching
        const statsTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stats fetch timeout')), 8000)
        );

        try {
          const stats = await Promise.race([
            Promise.all(statsPromises),
            statsTimeout
          ]) as GroupStats[];
          
          setGroupStats(stats.filter(stat => stat !== null));
        } catch (statsError) {
          console.error('Stats fetch timeout or error:', statsError);
          // Set default stats for all groups
          const defaultStats = availableGroups.map(group => ({
            group_name: group.name,
            total_scores: 0,
            average_score: 0,
            best_score: 0,
            current_streak: 0
          }));
          setGroupStats(defaultStats);
        }
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // Set some defaults so the page doesn't break
        if (!profile) {
          setProfile({
            display_name: '',
            email: user.email || '',
            birthday: '',
            avatar_url: '',
            handicap: 0
          });
        }
      } finally {
        setLoading(false);
      }
    };

    // Add overall timeout to prevent infinite loading
    const overallTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Profile page loading timeout - forcing completion');
        setLoadingTimeout(true);
        setLoading(false);
      }
    }, 12000);

    if (user && availableGroups.length > 0) {
      fetchProfile();
    } else if (user) {
      // If user exists but no groups, still set basic profile
      setProfile({
        display_name: '',
        email: user.email || '',
        birthday: '',
        avatar_url: '',
        handicap: 0
      });
      setLoading(false);
    }

    return () => clearTimeout(overallTimeout);
  }, [user, availableGroups.length]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !profile) return;

    setSaving(true);
    setMessage('');

    try {
      // Prepare update data
      const updateData: any = {
        display_name: profile.display_name,
        birthday: profile.birthday || null,
        updated_at: new Date().toISOString()
      };

      // If birthday is provided, also save as separate month/day fields for tournament system
      if (profile.birthday) {
        const birthdayDate = new Date(profile.birthday);
        updateData.birth_month = birthdayDate.getMonth() + 1; // Convert 0-based to 1-based
        updateData.birth_day = birthdayDate.getDate();
      } else {
        // Clear the separate fields if birthday is removed
        updateData.birth_month = null;
        updateData.birth_day = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage('Profile updated successfully!');
      
      setMessageType('success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage(error.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !supabase) return;

    setUploadingAvatar(true);
    setMessage('');

    try {
      const result = await uploadAvatar(supabase, user.id, file);
      
      if (result.success && result.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatar_url: result.avatarUrl } : null);
        setMessage('Profile picture updated successfully!');
        setMessageType('success');
      } else {
        throw new Error(result.error || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setMessage(error.message || 'Failed to upload profile picture');
      setMessageType('error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !supabase) return;

    setUploadingAvatar(true);
    setMessage('');

    try {
      const result = await removeAvatar(supabase, user.id);
      
      if (result.success) {
        setProfile(prev => prev ? { ...prev, avatar_url: '' } : null);
        setMessage('Profile picture removed successfully!');
        setMessageType('success');
      } else {
        throw new Error(result.error || 'Failed to remove avatar');
      }
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setMessage(error.message || 'Failed to remove profile picture');
      setMessageType('error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreateTournament = async () => {
    setMessage('Tournament creation is handled through the admin center.');
    setMessageType('warning');
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

  if (loadingTimeout) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Loading took too long</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">There might be an issue loading your profile data.</p>
          <div className="space-x-4">
            <Link href="/golf/clubhouse" className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition">
              Go to Clubhouse
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition"
            >
              Try Again
            </button>
          </div>
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
            {selectedGroup ? (
              <Link href={`/golf/${selectedGroup.id}/dashboard`} className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">
                Dashboard
              </Link>
            ) : (
              <Link href="/golf/clubhouse" className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">
                Clubhouse
              </Link>
            )}
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu selectedGroup={selectedGroup} />
          </div>
        </nav>

        <WordleHeader label="PLAYER CARD" />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--muted-foreground))]">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
              <div className="flex items-start gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <UserAvatar 
                    avatarUrl={profile?.avatar_url}
                    displayName={profile?.display_name || 'User'}
                    size="xl"
                    className="border-4 border-[hsl(var(--primary))] mb-4"
                  />
                  <div className="flex gap-2">
                    <label className="bg-[#6aaa64] text-white px-3 py-1 rounded-lg hover:bg-[#599a5b] transition cursor-pointer text-sm font-semibold">
                      <Upload size={14} className="inline mr-1" />
                      {uploadingAvatar ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    {profile?.avatar_url && (
                      <button
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
                    {profile?.display_name || 'User'}
                  </h2>
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">{profile?.email}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy size={16} className="text-[#6aaa64]" />
                        <span className="text-sm font-semibold">Handicap</span>
                      </div>
                      <span className="text-lg font-bold">{profile?.handicap?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-[#6aaa64]" />
                        <span className="text-sm font-semibold">Groups</span>
                      </div>
                      <span className="text-lg font-bold">{availableGroups.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      value={profile?.display_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={profile?.birthday || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, birthday: e.target.value } : prev)}
                      className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                    />
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Used for birthday tournaments
                    </p>
                  </div>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg ${
                    messageType === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : messageType === 'warning' 
                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6aaa64] text-white px-6 py-2 rounded-lg hover:bg-[#599a5b] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            {/* Group Statistics */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Group Statistics</h3>
              
              {groupStats.length === 0 ? (
                <p className="text-[hsl(var(--muted-foreground))]">No statistics available yet. Join a group and start playing!</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupStats.map((stat, idx) => (
                    <div key={idx} className="bg-[hsl(var(--muted))] rounded-lg p-4">
                      <h4 className="font-semibold text-[hsl(var(--foreground))] mb-3">{stat.group_name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Games Played:</span>
                          <span className="font-semibold">{stat.total_scores}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Average Score:</span>
                          <span className="font-semibold">{stat.average_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Best Score:</span>
                          <span className="font-semibold">{stat.best_score || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--muted-foreground))]">Current Streak:</span>
                          <span className="font-semibold">{stat.current_streak} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link 
                  href="/golf/clubhouse"
                  className="flex items-center gap-3 p-4 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--accent))] transition"
                >
                  <Users className="text-[#6aaa64]" size={24} />
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--foreground))]">Switch Groups</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Change active group or join new ones</p>
                  </div>
                </Link>
                <Link 
                  href="/auth/logout"
                  className="flex items-center gap-3 p-4 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--accent))] transition"
                >
                  <User className="text-[#6aaa64]" size={24} />
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--foreground))]">Sign Out</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Log out of your account</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 