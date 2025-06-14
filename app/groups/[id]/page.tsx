'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useAuth as useAuthContext } from '../../../contexts/AuthContext'
import type { Group, GroupMember, Profile } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { leaveGroup as leaveGroupLib } from '../../../lib/groups'

interface GroupWithMembers extends Group {
  members: (GroupMember & { profiles: Profile })[]
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const { supabase } = useAuthContext()
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const groupId = params.id
  const router = useRouter()

  useEffect(() => {
    if (user && groupId) {
      fetchGroupDetails()
    }
  }, [user, groupId])

  const fetchGroupDetails = async () => {
    try {
      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError

      // Get group members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles (
            id,
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId)

      if (membersError) throw membersError

      setGroup({
        ...groupData,
        members: membersData
      })
    } catch (error: any) {
      setMessage(`Error loading group: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const leaveGroup = async () => {
    try {
      await leaveGroupLib(supabase, params.id)
      router.push('/groups')
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code)
      setMessage('Invite code copied to clipboard!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const generateNewInviteCode = async () => {
    if (!isAdmin) return
    
    try {
      // Generate a new 6-character code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { error } = await supabase
        .from('groups')
        .update({ invite_code: newCode })
        .eq('id', groupId)
      
      if (error) throw error
      
      // Refresh group data
      await fetchGroupDetails()
      setMessage('New invite code generated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`Error generating new code: ${error.message}`)
    }
  }

  const shareInvite = () => {
    if (group?.invite_code) {
      const shareText = `Join our Wordle Golf group "${group.name}"! Use invite code: ${group.invite_code}`
      
      if (navigator.share) {
        navigator.share({
          title: `Join ${group.name}`,
          text: shareText,
        })
      } else {
        navigator.clipboard.writeText(shareText)
        setMessage('Invite message copied to clipboard!')
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }

  const deleteGroup = async () => {
    if (!isAdmin || !group) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${group.name}"? This will permanently delete the group and all its data. This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    try {
      // Delete the group (cascade will handle related data)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
      
      if (error) throw error
      
      setMessage('Group deleted successfully!')
      // Redirect to groups page after a short delay
      setTimeout(() => {
        router.push('/groups')
      }, 1500)
    } catch (error: any) {
      setMessage(`Error deleting group: ${error.message}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
          <Link href="/groups" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600">
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  const userMember = group.members.find(m => m.user_id === user.id)
  const isAdmin = userMember?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mb-4">{group.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{group.members.length} members</span>
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/leaderboard?group=${group.id}`}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Leaderboard
            </Link>
            <Link
              href="/submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Submit Score
            </Link>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Invite Code Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Code</h2>
          <div className="flex items-center space-x-3 mb-3">
            <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
              {group.invite_code}
            </code>
            <button
              onClick={copyInviteCode}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
            >
              Copy Code
            </button>
            <button
              onClick={shareInvite}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
            >
              Share Invite
            </button>
            {isAdmin && (
              <button
                onClick={generateNewInviteCode}
                className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 text-sm"
              >
                New Code
              </button>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Share this code with others to invite them to the group.
            {isAdmin && " As an admin, you can generate a new code if needed."}
          </p>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Members</h2>
          <div className="space-y-3">
            {group.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {member.profiles.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt={member.profiles.display_name || member.profiles.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(member.profiles.display_name || member.profiles.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {member.profiles.display_name || member.profiles.email}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    member.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                  {member.user_id === user.id && (
                    <span className="text-xs text-gray-500">(You)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions Section */}
        {isAdmin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Admin Actions</h3>
            <p className="text-red-700 text-sm mb-3">
              As the group admin, you can permanently delete this group. This will remove all group data, scores, and member history.
            </p>
            <button
              onClick={deleteGroup}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
            >
              🗑️ Delete Group Permanently
            </button>
          </div>
        )}

        {/* Actions Section */}
        <div className="flex justify-between items-center">
          <Link href="/groups" className="text-primary-500 hover:text-primary-600">
            ← Back to Groups
          </Link>
          
          {!isAdmin && (
            <button
              onClick={leaveGroup}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 