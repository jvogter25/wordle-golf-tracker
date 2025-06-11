import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { signInWithEmail } from '../../lib/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await signInWithEmail(email.trim())
      Alert.alert(
        'Check Your Email!',
        `We've sent a magic link to ${email}. Click the link in your email to sign in.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to send magic link. Please try again.')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo/Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
            <Ionicons name="golf" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Wordle Golf Tracker
          </Text>
          <Text className="text-gray-600 text-center">
            Track your family's Wordle scores with golf-style handicaps
          </Text>
        </View>

        {/* Sign In Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg"
            />
          </View>

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className={`py-4 rounded-lg ${
              loading ? 'bg-gray-300' : 'bg-primary-500'
            }`}
          >
            <Text className="text-white font-semibold text-center text-lg">
              {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-900 font-medium mb-1">
                No password required!
              </Text>
              <Text className="text-blue-800 text-sm">
                We'll send you a secure link to sign in. Just click the link in your email and you're in!
              </Text>
            </View>
          </View>
        </View>

        {/* Features Preview */}
        <View className="mt-8 space-y-3">
          <Text className="text-lg font-semibold text-gray-900 text-center mb-4">
            What you can do:
          </Text>
          
          <View className="flex-row items-center">
            <Ionicons name="people" size={20} color="#0ea5e9" />
            <Text className="ml-3 text-gray-700">Create or join family groups</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="add-circle" size={20} color="#0ea5e9" />
            <Text className="ml-3 text-gray-700">Submit daily Wordle scores</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={20} color="#0ea5e9" />
            <Text className="ml-3 text-gray-700">Compete with USGA-style handicaps</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="stats-chart" size={20} color="#0ea5e9" />
            <Text className="ml-3 text-gray-700">Track your progress over time</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
} 