import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../contexts/AuthContext'
import '../global.css'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerTitle: 'Sign In' }} />
        <Stack.Screen name="groups/create" options={{ headerTitle: 'Create Group' }} />
        <Stack.Screen name="groups/join" options={{ headerTitle: 'Join Group' }} />
        <Stack.Screen name="profile/edit" options={{ headerTitle: 'Edit Profile' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  )
} 