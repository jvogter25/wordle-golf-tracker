import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'

export default function GroupsScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const userGroups = await getUserGroups()
      setGroups(userGroups)
    } catch (error) {
      Alert.alert('Error', 'Failed to load groups')
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading groups...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {groups.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
              No Groups Yet
            </Text>
            <Text className="text-gray-600 text-center mb-6 px-4">
              Create a family group or join an existing one to start tracking your Wordle scores!
            </Text>
            <View className="flex-row space-x-4">
              <Link href="/groups/create" asChild>
                <TouchableOpacity className="bg-primary-500 px-6 py-3 rounded-lg">
                  <Text className="text-white font-semibold">Create Group</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/groups/join" asChild>
                <TouchableOpacity className="bg-gray-200 px-6 py-3 rounded-lg">
                  <Text className="text-gray-700 font-semibold">Join Group</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        ) : (
          <View>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-900">My Groups</Text>
              <View className="flex-row space-x-2">
                <Link href="/groups/create" asChild>
                  <TouchableOpacity className="bg-primary-500 px-4 py-2 rounded-lg">
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </Link>
                <Link href="/groups/join" asChild>
                  <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-lg">
                    <Ionicons name="person-add" size={20} color="#374151" />
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      {group.name}
                    </Text>
                    {group.description && (
                      <Text className="text-gray-600 mb-2">{group.description}</Text>
                    )}
                    <Text className="text-sm text-gray-500">
                      Joined {new Date(group.joined_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-primary-100 px-2 py-1 rounded">
                      <Text className="text-primary-700 text-xs font-medium">
                        {group.role}
                      </Text>
                    </View>
                    <TouchableOpacity className="mt-2">
                      <Text className="text-primary-500 text-sm font-medium">
                        Invite Code: {group.invite_code}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
} 