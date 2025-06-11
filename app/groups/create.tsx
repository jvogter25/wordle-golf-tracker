import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createGroup } from '../../lib/groups'

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }

    if (groupName.length < 2) {
      Alert.alert('Error', 'Group name must be at least 2 characters long')
      return
    }

    setLoading(true)
    try {
      const group = await createGroup(groupName.trim(), description.trim() || undefined)
      
      Alert.alert(
        'Group Created!',
        `Your group "${group.name}" has been created successfully. Share the invite code "${group.invite_code}" with family members to let them join.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.')
      console.error('Create group error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#0ea5e9" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Create Family Group
            </Text>
            <Text className="text-gray-600 text-center">
              Start a new group to track Wordle scores with your family and friends
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g., Smith Family, Work Friends"
                maxLength={50}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg"
              />
              <Text className="text-gray-500 text-sm mt-1">
                Choose a name that identifies your group
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description for your group"
                multiline
                numberOfLines={3}
                maxLength={200}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-gray-500 text-sm mt-1">
                Optional description to help identify your group
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCreateGroup}
              disabled={loading || !groupName.trim()}
              className={`py-4 rounded-lg ${
                loading || !groupName.trim() ? 'bg-gray-300' : 'bg-primary-500'
              }`}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? 'Creating Group...' : 'Create Group'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-medium mb-2">
                  After creating your group:
                </Text>
                <View className="space-y-1">
                  <Text className="text-blue-800 text-sm">
                    • You'll get a unique invite code to share
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Family members can join using the code
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • You'll be the group admin
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Start submitting daily Wordle scores to compete!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features */}
          <View className="mt-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Group Features:
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="golf" size={20} color="#22c55e" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">USGA Golf Scoring</Text>
                  <Text className="text-gray-600 text-sm">
                    Convert Wordle attempts to golf scores with handicaps
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="trophy" size={20} color="#f59e0b" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Monthly Leaderboards</Text>
                  <Text className="text-gray-600 text-sm">
                    Track family rankings with fair handicap adjustments
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="stats-chart" size={20} color="#8b5cf6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Personal Statistics</Text>
                  <Text className="text-gray-600 text-sm">
                    View detailed performance analytics and trends
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
} 