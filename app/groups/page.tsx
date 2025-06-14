'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useAuth as useAuthContext } from '../../contexts/AuthContext'
import type { Group, GroupMember, Profile } from '../../lib/supabase'

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth()
  const { supabase } = useAuthContext()
  const [groups, setGroups] = useState<(Group & { member_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    console.log('🔄 Groups page: Auth state changed', { user: user?.email, authLoading })
    
    if (!authLoading) {
      if (user) {
        console.log('✅ User found, fetching groups')
        fetchGroups()
      } else {
        console.log('ℹ️ No user, stopping loading')
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const fetchGroups = async () => {
    try {
      console.log('🔄 Fetching groups for user:', user?.email)
      setLoading(true)
      
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            description,
            created_by,
            created_at,
            invite_code
          )
        `)
        .eq('user_id', user?.id)

      if (error) throw error

      console.log('✅ Groups data received:', data?.length || 0, 'groups')

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        data.map(async (item: any) => {
          const group = item.groups
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return {
            ...group,
            member_count: count || 0
          }
        })
      )

      setGroups(groupsWithCounts)
      console.log('✅ Groups with counts set:', groupsWithCounts.length)
    } catch (error) {
      console.error('❌ Error fetching groups:', error)
      setMessage('Error loading groups')
    } finally {
      setLoading(false)
      console.log('✅ Groups loading complete')
    }
  }

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      // Import and use the library function
      const { createGroup: createGroupLib } = await import('../../lib/groups')
      
      await createGroupLib(
        newGroupName.trim(),
        newGroupDescription.trim() || undefined
      )

      setMessage('Group created successfully!')
      setShowCreateForm(false)
      setNewGroupName('')
      setNewGroupDescription('')
      fetchGroups()
    } catch (error: any) {
      setMessage(`Error creating group: ${error.message}`)
    }
  }

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    try {
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single()

      if (groupError || !group) {
        setMessage('Invalid invite code')
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user?.id)
        .single()

      if (existingMember) {
        setMessage('You are already a member of this group')
        return
      }

      // Add as member
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user?.id,
          role: 'member'
        })

      if (joinError) throw joinError

      setMessage('Successfully joined group!')
      setShowJoinForm(false)
      setJoinCode('')
      fetchGroups()
    } catch (error: any) {
      setMessage(`Error joining group: ${error.message}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading groups...</p>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
          <div className="space-x-4">
            <button
              onClick={() => setShowJoinForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Join Group
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Create Group
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Group</h2>
              <form onSubmit={createGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Smith Family"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Family competition for daily Wordle"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Join Group</h2>
              <form onSubmit={joinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-center"
                    placeholder="ABCD12"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-character code from your family admin
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
                  >
                    Join
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h2>
            <p className="text-gray-600 mb-6">Create a new group or join an existing one to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-gray-600 mb-4">{group.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{group.member_count} members</span>
                  <span>Code: {group.invite_code}</span>
                </div>
                <div className="space-y-2">
                  <Link
                    href={`/groups/${group.id}`}
                    className="block w-full text-center bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
                  >
                    View Group
                  </Link>
                  <Link
                    href={`/leaderboard?group=${group.id}`}
                    className="block w-full text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 