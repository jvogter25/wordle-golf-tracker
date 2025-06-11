'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [viewType, setViewType] = useState<'net' | 'raw'>('net')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchUserGroups()
    }
  }, [user])

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard()
    }
  }, [selectedGroup, viewType])

  const getNextMonthStart = (currentMonth: string): string => {
    const date = new Date(currentMonth + '-01')
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().slice(0, 7) + '-01'
  }

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', user?.id)

      if (error) throw error

      const userGroups = data.map((item: any) => item.groups).filter(Boolean)
      setGroups(userGroups)
      
      if (userGroups.length === 1) {
        setSelectedGroup(userGroups[0].id)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchLeaderboard = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      // Get current month's scores with user profiles
      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM format

      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select(`
          *,
          profiles (display_name, email, avatar_url)
        `)
        .eq('group_id', selectedGroup)
        .gte('puzzle_date', `${currentMonth}-01`)
        .lt('puzzle_date', `${getNextMonthStart(currentMonth)}`)
        .order('puzzle_date', { ascending: true })

      if (scoresError) throw scoresError

      // Get handicaps for the group
      const { data: handicaps, error: handicapsError } = await supabase
        .from('handicaps')
        .select('*')
        .eq('group_id', selectedGroup)

      if (handicapsError) throw handicapsError

      // Process leaderboard data
      const playerStats = new Map()

      scores?.forEach(score => {
        const userId = score.user_id
        const playerName = score.profiles?.display_name || score.profiles?.email || 'Unknown'
        const playerAvatar = score.profiles?.avatar_url
        
        if (!playerStats.has(userId)) {
          const handicap = handicaps?.find(h => h.user_id === userId)?.current_handicap || 0
          playerStats.set(userId, {
            userId,
            name: playerName,
            avatar: playerAvatar,
            totalRaw: 0,
            totalNet: 0,
            gamesPlayed: 0,
            handicap,
            scores: []
          })
        }

                 const player = playerStats.get(userId)
         const playerHandicap = handicaps?.find(h => h.user_id === userId)?.current_handicap || 0
         player.totalRaw += score.raw_score
         player.totalNet += Math.max(-3, score.raw_score - playerHandicap) // Cap at hole-in-one
         player.gamesPlayed += 1
        player.scores.push({
          date: score.puzzle_date,
          raw: score.raw_score,
          golf_score: score.golf_score,
          attempts: score.attempts
        })
      })

      // Convert to array and sort
      const leaderboardData = Array.from(playerStats.values())
        .filter(player => player.gamesPlayed > 0)
        .map(player => ({
          ...player,
          avgRaw: player.totalRaw / player.gamesPlayed,
          avgNet: player.totalNet / player.gamesPlayed
        }))
        .sort((a, b) => {
          if (viewType === 'net') {
            return a.avgNet - b.avgNet
          }
          return a.avgRaw - b.avgRaw
        })

      setLeaderboard(leaderboardData)
    } catch (error: any) {
      setMessage(`Error loading leaderboard: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatScore = (score: number): string => {
    if (score === 0) return 'E'
    return score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)
  }

  const getPositionSuffix = (position: number): string => {
    if (position === 1) return 'st'
    if (position === 2) return 'nd'
    if (position === 3) return 'rd'
    return 'th'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <Link href="/auth/login" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Current month rankings</p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-center">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {groups.length > 1 && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a group...</option>
                  {groups.map((group: any) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Type
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewType('net')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    viewType === 'net'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Net Scores
                </button>
                <button
                  onClick={() => setViewType('raw')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    viewType === 'raw'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Raw Scores
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : !selectedGroup ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Please select a group to view the leaderboard</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏌️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scores yet</h3>
              <p className="text-gray-600 mb-4">Be the first to submit a score this month!</p>
              <Link
                href="/submit"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
              >
                Submit Score
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    player.userId === user?.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-3">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                          {player.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-600">
                          {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} played
                          {viewType === 'net' && ` • ${player.handicap.toFixed(1)} handicap`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatScore(viewType === 'net' ? player.avgNet : player.avgRaw)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {viewType === 'net' ? 'Net Average' : 'Raw Average'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center space-x-4">
          <Link href="/groups" className="text-primary-500 hover:text-primary-600">
            ← Back to Groups
          </Link>
          <Link href="/submit" className="text-primary-500 hover:text-primary-600">
            Submit Score →
          </Link>
        </div>
      </div>
    </div>
  )
} 