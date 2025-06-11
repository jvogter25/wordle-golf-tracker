import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups, createGroup, joinGroup, leaveGroup } from '../../lib/groups'

export default function GroupsScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (user) {
      loadGroups()
    }
  }, [user])

  const loadGroups = async () => {
    try {
      const userGroups = await getUserGroups()
      setGroups(userGroups)
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name')
      return
    }

    setLoading(true)
    try {
      await createGroup(groupName.trim(), groupDescription.trim())
      setGroupName('')
      setGroupDescription('')
      setShowCreateModal(false)
      loadGroups()
    } catch (error) {
      alert('Failed to create group: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      alert('Please enter an invite code')
      return
    }

    setLoading(true)
    try {
      await joinGroup(inviteCode.trim().toUpperCase())
      setInviteCode('')
      setShowJoinModal(false)
      loadGroups()
    } catch (error) {
      alert('Failed to join group: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (confirm(`Are you sure you want to leave "${groupName}"?`)) {
      try {
        await leaveGroup(groupId)
        loadGroups()
      } catch (error) {
        alert('Failed to leave group: ' + error.message)
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Wordle Golf</h2>
          <p className="text-gray-600 mb-6">Please log in to view your groups</p>
          <Link href="/auth/login" className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Join Group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Create Group
            </button>
          </div>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Groups Yet</h3>
            <p className="text-gray-600 mb-6">Create a new group or join an existing one to start competing!</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600"
              >
                Create Your First Group
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Join a Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleLeaveGroup(group.id, group.name)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Leave group"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  <p>Invite Code: <span className="font-mono font-semibold">{group.invite_code}</span></p>
                  <p>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</p>
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/(tabs)/leaderboard?group=${group.id}`}
                    className="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href={`/(tabs)/submit?group=${group.id}`}
                    className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600"
                  >
                    Submit Score
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Join Group</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code..."
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={loading}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 