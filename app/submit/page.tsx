'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useAuth as useAuthContext } from '../../contexts/AuthContext'
import type { Group } from '../../lib/supabase'

export default function SubmitPage() {
  const { user, loading: authLoading } = useAuth()
  const { supabase } = useAuthContext()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [attempts, setAttempts] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchUserGroups()
    }
  }, [user])

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

  const getGolfScore = (attempts: number): { score: string; rawScore: number } => {
    switch (attempts) {
      case 1: return { score: 'Hole in One', rawScore: 1 }
      case 2: return { score: 'Eagle', rawScore: 2 }
      case 3: return { score: 'Birdie', rawScore: 3 }
      case 4: return { score: 'Par', rawScore: 4 }
      case 5: return { score: 'Bogey', rawScore: 5 }
      case 6: return { score: 'Double Bogey', rawScore: 6 }
      case 7: return { score: 'Failed (7 attempts)', rawScore: 7 }
      default: return { score: 'Invalid', rawScore: 7 }
    }
  }

  const getTodaysPuzzleDate = (): string => {
    // Get Pacific Time date (Wordle resets at midnight PT)
    const now = new Date()
    const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
    return pacificTime.toISOString().split('T')[0]
  }

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGroup || !attempts) {
      setMessage('Please select a group and enter your attempts')
      return
    }

    const attemptsNum = parseInt(attempts)
    if (attemptsNum < 1 || attemptsNum > 7) {
      setMessage('Attempts must be between 1 and 7')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const puzzleDate = getTodaysPuzzleDate()
      const { score, rawScore } = getGolfScore(attemptsNum)

      // Check if already submitted for today
      const { data: existing } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('group_id', selectedGroup)
        .eq('puzzle_date', puzzleDate)
        .single()

      if (existing) {
        setMessage('You have already submitted a score for today in this group')
        setLoading(false)
        return
      }

      // Submit score
      const { error } = await supabase
        .from('scores')
        .insert({
          user_id: user?.id,
          group_id: selectedGroup,
          puzzle_date: puzzleDate,
          attempts: attemptsNum,
          golf_score: score,
          raw_score: rawScore
        })

      if (error) throw error

      setMessage(`Score submitted! You got a ${score} (${rawScore > 0 ? '+' : ''}${rawScore})`)
      setAttempts('')
    } catch (error: any) {
      setMessage(`Error submitting score: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const previewScore = () => {
    const attemptsNum = parseInt(attempts)
    if (attemptsNum >= 1 && attemptsNum <= 7) {
      const { score, rawScore } = getGolfScore(attemptsNum)
      return `${score} (${rawScore > 0 ? '+' : ''}${rawScore})`
    }
    return ''
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Today's Score</h1>
          <p className="text-gray-600">How many attempts did your Wordle take?</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={submitScore} className="space-y-6">
            {groups.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Choose a group...</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Attempts
              </label>
              <select
                value={attempts}
                onChange={(e) => setAttempts(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg"
                required
              >
                <option value="">Select attempts...</option>
                <option value="1">1 attempt - Hole in One! 🏆</option>
                <option value="2">2 attempts - Eagle 🦅</option>
                <option value="3">3 attempts - Birdie 🐦</option>
                <option value="4">4 attempts - Par ⭐</option>
                <option value="5">5 attempts - Bogey 😐</option>
                <option value="6">6 attempts - Double Bogey 😬</option>
                <option value="7">Failed (7 attempts) ❌</option>
              </select>
            </div>

            {attempts && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Golf Score Preview:</h3>
                <p className="text-blue-700 text-lg">{previewScore()}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedGroup || !attempts}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Score'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Golf Scoring Guide:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>1 attempt = Hole in One (-3)</div>
              <div>2 attempts = Eagle (-2)</div>
              <div>3 attempts = Birdie (-1)</div>
              <div>4 attempts = Par (0)</div>
              <div>5 attempts = Bogey (+1)</div>
              <div>6 attempts = Double Bogey (+2)</div>
              <div>Failed = +7 penalty</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <Link href="/groups" className="text-primary-500 hover:text-primary-600">
            ← Back to Groups
          </Link>
          <Link href="/leaderboard" className="text-primary-500 hover:text-primary-600">
            View Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  )
} 