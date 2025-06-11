import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { joinGroupByCode } from '../../lib/groups'

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code')
      return
    }

    if (inviteCode.length < 6) {
      Alert.alert('Error', 'Invite codes are 6 characters long')
      return
    }

    setLoading(true)
    try {
      const group = await joinGroupByCode(inviteCode.trim().toUpperCase())
      
      Alert.alert(
        'Welcome to the Group!',
        `You've successfully joined "${group.name}". You can now submit scores and compete with other members!`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      )
    } catch (error) {
      if (error.message === 'Invalid invite code') {
        Alert.alert('Invalid Code', 'The invite code you entered is not valid. Please check and try again.')
      } else if (error.message === 'Already a member of this group') {
        Alert.alert('Already Joined', 'You are already a member of this group!')
      } else {
        Alert.alert('Error', 'Failed to join group. Please try again.')
      }
      console.error('Join group error:', error)
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
              <Ionicons name="person-add" size={32} color="#0ea5e9" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Join Family Group
            </Text>
            <Text className="text-gray-600 text-center">
              Enter the invite code shared by your family member to join their group
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter 6-character code"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xl font-mono text-center tracking-widest"
              />
              <Text className="text-gray-500 text-sm mt-1 text-center">
                Ask a group member for the invite code
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleJoinGroup}
              disabled={loading || !inviteCode.trim() || inviteCode.length < 6}
              className={`py-4 rounded-lg ${
                loading || !inviteCode.trim() || inviteCode.length < 6 
                  ? 'bg-gray-300' 
                  : 'bg-primary-500'
              }`}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? 'Joining Group...' : 'Join Group'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-medium mb-2">
                  How to get an invite code:
                </Text>
                <View className="space-y-1">
                  <Text className="text-blue-800 text-sm">
                    • Ask a family member who's already in the group
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • They can find the code in their Groups tab
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Codes are 6 characters (letters and numbers)
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Each group has a unique code
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Example */}
          <View className="mt-8 bg-gray-100 rounded-lg p-4">
            <Text className="text-gray-700 font-medium mb-2">
              Example invite codes:
            </Text>
            <View className="flex-row justify-around">
              <Text className="font-mono text-lg text-gray-600 bg-white px-3 py-2 rounded">
                ABC123
              </Text>
              <Text className="font-mono text-lg text-gray-600 bg-white px-3 py-2 rounded">
                XYZ789
              </Text>
              <Text className="font-mono text-lg text-gray-600 bg-white px-3 py-2 rounded">
                FAM456
              </Text>
            </View>
          </View>

          {/* Alternative */}
          <View className="mt-8 text-center">
            <Text className="text-gray-600 mb-4">
              Don't have a group to join?
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/groups/create')}
              className="bg-gray-200 py-3 px-6 rounded-lg"
            >
              <Text className="text-gray-700 font-semibold text-center">
                Create Your Own Group
              </Text>
            </TouchableOpacity>
          </View>

          {/* What happens next */}
          <View className="mt-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              After joining:
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Start Competing</Text>
                  <Text className="text-gray-600 text-sm">
                    Submit daily Wordle scores to join the competition
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="trophy" size={20} color="#f59e0b" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">View Leaderboards</Text>
                  <Text className="text-gray-600 text-sm">
                    See how you stack up against family members
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="stats-chart" size={20} color="#8b5cf6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Track Progress</Text>
                  <Text className="text-gray-600 text-sm">
                    Monitor your handicap and improvement over time
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