'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from './UserAvatar'

interface NavigationAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showHandicap?: boolean
  linkTo?: string
  className?: string
}

export default function NavigationAvatar({ 
  size = 'md',
  showName = false,
  showHandicap = false,
  linkTo = '/golf/player',
  className = ''
}: NavigationAvatarProps) {
  const { user, supabase } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [handicap, setHandicap] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setProfile(data)
        }

        // Fetch handicap from the all-time leaderboard function
        if (showHandicap) {
          const { data: leaderboardData, error: handicapError } = await supabase.rpc('get_all_time_leaderboard')
          if (!handicapError && leaderboardData) {
            const userHandicap = leaderboardData.find((player: any) => player.id === user.id)
            if (userHandicap) {
              setHandicap(userHandicap.handicap || 0)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase, showHandicap])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-24 h-24'} bg-gray-200 rounded-full`}></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={className}>
        <UserAvatar size={size} />
      </div>
    )
  }

  const content = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <UserAvatar 
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={user.email}
        size={size}
        className="border-2 border-[hsl(var(--primary))] object-cover"
      />
      {(showName || showHandicap) && (
        <div className="hidden md:block">
          {showName && (
            <h2 className="font-semibold text-[hsl(var(--foreground))]">
              {profile?.display_name || user.email}
            </h2>
          )}
          {showHandicap && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Handicap: {handicap > 0 ? `+${handicap.toFixed(1)}` : handicap.toFixed(1)}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link href={linkTo}>
        {content}
      </Link>
    )
  }

  return content
} 