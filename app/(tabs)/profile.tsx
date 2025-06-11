import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'
import { getUserMonthlyStats } from '../../lib/scores'

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadStats()
    }
  }, [selectedGroup])

  const loadGroups = async () => {
    try {
      const userGroups = await getUserGroups()
      setGroups(userGroups)
      if (userGroups.length === 1) {
        setSelectedGroup(userGroups[0])
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const loadStats = async () => {
    if (!selectedGroup || !user) return
    
    setLoading(true)
    try {
      const now = new Date()
      const currentStats = await getUserMonthlyStats(
        user.id, 
        selectedGroup.id, 
        now.getFullYear(), 
        now.getMonth() + 1
      )
      setStats(currentStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mr-4">
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={32} color="#0ea5e9" />
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {profile?.display_name || 'Anonymous Player'}
            </Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>

          <Link href="/profile/edit" asChild>
            <TouchableOpacity className="p-2">
              <Ionicons name="create-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Group Selection */}
        {groups.length > 1 && (
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">View Stats for Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroup(group)}
                  className={`mr-2 px-4 py-2 rounded-lg ${
                    selectedGroup?.id === group.id
                      ? 'bg-primary-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedGroup?.id === group.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Statistics */}
      {selectedGroup && (
        <View className="p-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            This Month's Stats
          </Text>

          {loading ? (
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-gray-600">Loading stats...</Text>
            </View>
          ) : stats ? (
            <View className="space-y-4">
              {/* Main Stats Cards */}
              <View className="flex-row space-x-4">
                <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                  <Text className="text-gray-600 text-sm font-medium">Games Played</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {stats.gamesPlayed}
                  </Text>
                </View>
                
                <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                  <Text className="text-gray-600 text-sm font-medium">Handicap</Text>
                  <Text className="text-2xl font-bold text-primary-600">
                    {stats.handicap.toFixed(1)}
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-lg p-4 border border-gray-200">
                <Text className="text-gray-600 text-sm font-medium mb-2">Average Score</Text>
                <Text className={`text-2xl font-bold ${
                  stats.avgScore < 0 ? 'text-green-600' : 
                  stats.avgScore === 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.avgScore > 0 ? '+' : ''}{stats.avgScore.toFixed(1)}
                </Text>
              </View>

              {/* Recent Scores */}
              {stats.scores.length > 0 && (
                <View className="bg-white rounded-lg p-4 border border-gray-200">
                  <Text className="text-lg font-semibold text-gray-900 mb-3">
                    Recent Scores
                  </Text>
                  <View className="space-y-2">
                    {stats.scores.slice(-5).reverse().map((score, index) => (
                      <View 
                        key={score.id || index}
                        className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <Text className="text-gray-600">
                          {new Date(score.puzzle_date).toLocaleDateString()}
                        </Text>
                        <View className="items-end">
                          <Text className="font-semibold text-gray-900">
                            {score.golf_score}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {score.attempts} attempts
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View className="bg-white rounded-lg p-6 items-center">
              <Ionicons name="stats-chart-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-600 mt-2 text-center">
                No stats available for this group yet.
                Submit your first score to see statistics!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Groups List */}
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">My Groups</Text>
        {groups.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-600 mt-2 text-center">
              You're not part of any groups yet.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {groups.map((group) => (
              <View 
                key={group.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">
                      {group.name}
                    </Text>
                    {group.description && (
                      <Text className="text-gray-600 text-sm mb-2">
                        {group.description}
                      </Text>
                    )}
                    <Text className="text-gray-500 text-sm">
                      Joined {new Date(group.joined_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="bg-primary-100 px-2 py-1 rounded">
                    <Text className="text-primary-700 text-xs font-medium">
                      {group.role}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Settings */}
      <View className="p-4 pb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">Settings</Text>
        <View className="bg-white rounded-lg border border-gray-200">
          <Link href="/profile/edit" asChild>
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-gray-900 font-medium">Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity 
            onPress={handleSignOut}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="ml-3 text-red-600 font-medium">Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
} 