import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      uploadImage(result.assets[0])
    }
  }

  const uploadImage = async (image: any) => {
    if (!user) return

    setUploadingImage(true)
    try {
      const fileExt = image.uri.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Convert image to blob
      const response = await fetch(image.uri)
      const blob = await response.blob()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: `image/${fileExt}`
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
      
      Alert.alert('Success', 'Profile photo uploaded successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.')
      console.error('Image upload error:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    if (displayName.length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters long')
      return
    }

    setLoading(true)
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString()
      })

      await refreshProfile()
      
      Alert.alert(
        'Profile Updated!',
        'Your profile has been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.')
      console.error('Profile update error:', error)
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
          {/* Profile Photo */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingImage}
              className="relative"
            >
              <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center">
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    className="w-24 h-24 rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#0ea5e9" />
                )}
                
                {/* Overlay for upload */}
                <View className="absolute inset-0 bg-black bg-opacity-30 rounded-full items-center justify-center">
                  {uploadingImage ? (
                    <Text className="text-white text-xs">Uploading...</Text>
                  ) : (
                    <Ionicons name="camera" size={24} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            <Text className="text-gray-600 text-sm mt-2 text-center">
              Tap to change profile photo
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <View className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
                <Text className="text-lg text-gray-600">{user?.email}</Text>
              </View>
              <Text className="text-gray-500 text-sm mt-1">
                Email cannot be changed
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Display Name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                maxLength={50}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg"
              />
              <Text className="text-gray-500 text-sm mt-1">
                This is how other family members will see your name
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || uploadingImage || displayName.length < 2}
              className={`py-4 rounded-lg ${
                loading || uploadingImage || displayName.length < 2 
                  ? 'bg-gray-300' 
                  : 'bg-primary-500'
              }`}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-medium mb-1">
                  Profile Tips
                </Text>
                <View className="space-y-1">
                  <Text className="text-blue-800 text-sm">
                    • Choose a display name that family members will recognize
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Profile photos help identify you on leaderboards
                  </Text>
                  <Text className="text-blue-800 text-sm">
                    • Your information is only visible to group members
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Privacy */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Privacy & Data
            </Text>
            
            <View className="bg-white rounded-lg border border-gray-200 p-4">
              <View className="flex-row items-start mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Private & Secure</Text>
                  <Text className="text-gray-600 text-sm">
                    Your profile information is only visible to members of your family groups
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Ionicons name="people" size={20} color="#3b82f6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Family Only</Text>
                  <Text className="text-gray-600 text-sm">
                    No public profiles or social features - just family fun!
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