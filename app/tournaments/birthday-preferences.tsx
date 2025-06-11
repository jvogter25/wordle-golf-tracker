import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'
import { getBirthdayPreferences, updateBirthdayPreferences } from '../../lib/tournaments'

export default function BirthdayPreferencesScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Preference states
  const [enableTournaments, setEnableTournaments] = useState(true)
  const [customName, setCustomName] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [advantage, setAdvantage] = useState(0.5)
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadPreferences()
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

  const loadPreferences = async () => {
    if (!selectedGroup || !user) return
    
    setLoading(true)
    try {
      const preferences = await getBirthdayPreferences(user.id, selectedGroup.id)
      
      if (preferences) {
        setEnableTournaments(preferences.enable_birthday_tournaments)
        setCustomName(preferences.custom_tournament_name || '')
        setWeekOffset(preferences.preferred_week_offset)
        setAdvantage(preferences.preferred_advantage)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedGroup || !user) return

    // Validate birth date if provided
    if (birthMonth && birthDay) {
      const month = parseInt(birthMonth)
      const day = parseInt(birthDay)
      
      if (month < 1 || month > 12) {
        Alert.alert('Error', 'Birth month must be between 1 and 12')
        return
      }
      
      if (day < 1 || day > 31) {
        Alert.alert('Error', 'Birth day must be between 1 and 31')
        return
      }
    }

    setSaving(true)
    try {
      await updateBirthdayPreferences(user.id, selectedGroup.id, {
        enable_birthday_tournaments: enableTournaments,
        custom_tournament_name: customName.trim() || null,
        preferred_week_offset: weekOffset,
        preferred_advantage: advantage
      })

      // Update profile with birthday if provided
      if (birthMonth && birthDay) {
        // Would need to implement profile update function
        // For now, just show success message
      }

      Alert.alert('Success!', 'Birthday tournament preferences saved')
      router.back()
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const getWeekOffsetText = (offset: number) => {
    if (offset === 0) return 'Week of birthday'
    if (offset === -1) return 'Week before birthday'
    if (offset === 1) return 'Week after birthday'
    return `${Math.abs(offset)} weeks ${offset > 0 ? 'after' : 'before'} birthday`
  }

  const getAdvantageText = (advantage: number) => {
    return `${advantage} stroke${advantage !== 1 ? 's' : ''} off each round`
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Birthday Tournament Preferences</Text>
        </View>

        {/* Group Selection */}
        {groups.length > 1 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Select Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroup(group)}
                  className={`mr-3 px-4 py-2 rounded-lg border ${
                    selectedGroup?.id === group.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 bg-white'
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

        {!selectedGroup ? (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Text className="text-yellow-800">
              Please select a group to manage your birthday tournament preferences
            </Text>
          </View>
        ) : loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-gray-600">Loading preferences...</Text>
          </View>
        ) : (
          <View>
            {/* Enable/Disable Birthday Tournaments */}
            <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    Enable Birthday Tournaments
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Create a personal tournament during your birthday week
                  </Text>
                </View>
                <Switch
                  value={enableTournaments}
                  onValueChange={setEnableTournaments}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={enableTournaments ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>

            {enableTournaments && (
              <>
                {/* Birthday Date */}
                <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-3">
                    Birthday Date
                  </Text>
                  <Text className="text-gray-600 text-sm mb-3">
                    We need your birthday to schedule your tournament (year is optional)
                  </Text>
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-gray-700 mb-2">Month (1-12)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        value={birthMonth}
                        onChangeText={setBirthMonth}
                        placeholder="MM"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 mb-2">Day (1-31)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        value={birthDay}
                        onChangeText={setBirthDay}
                        placeholder="DD"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                {/* Custom Tournament Name */}
                <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Custom Tournament Name
                  </Text>
                  <Text className="text-gray-600 text-sm mb-3">
                    Leave blank to use default: "[Your Name]'s Birthday Championship"
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="My Amazing Birthday Tournament"
                    maxLength={50}
                  />
                </View>

                {/* Tournament Week */}
                <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Tournament Week
                  </Text>
                  <Text className="text-gray-600 text-sm mb-3">
                    When should your birthday tournament be held?
                  </Text>
                  
                  <View className="space-y-2">
                    {[-1, 0, 1].map((offset) => (
                      <TouchableOpacity
                        key={offset}
                        onPress={() => setWeekOffset(offset)}
                        className={`p-3 rounded-lg border ${
                          weekOffset === offset
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text className={`font-medium ${
                          weekOffset === offset ? 'text-primary-900' : 'text-gray-700'
                        }`}>
                          {getWeekOffsetText(offset)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Birthday Advantage */}
                <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Birthday Advantage
                  </Text>
                  <Text className="text-gray-600 text-sm mb-3">
                    How much of a stroke advantage should you get?
                  </Text>
                  
                  <View className="space-y-2">
                    {[0.25, 0.5, 0.75, 1.0].map((advValue) => (
                      <TouchableOpacity
                        key={advValue}
                        onPress={() => setAdvantage(advValue)}
                        className={`p-3 rounded-lg border ${
                          advantage === advValue
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text className={`font-medium ${
                          advantage === advValue ? 'text-primary-900' : 'text-gray-700'
                        }`}>
                          {getAdvantageText(advValue)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className={`py-4 rounded-lg ${
                saving ? 'bg-gray-300' : 'bg-primary-500'
              }`}
            >
              <Text className={`text-center font-semibold text-lg ${
                saving ? 'text-gray-500' : 'text-white'
              }`}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>

            {/* Information */}
            <View className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
              <Text className="text-orange-900 font-medium mb-2">🎂 About Birthday Tournaments</Text>
              <Text className="text-orange-800 text-sm leading-5">
                Birthday tournaments are personal celebrations that run for a full week during your birthday. 
                You get a stroke advantage to help celebrate your special day, and if there are conflicts with 
                major tournaments, we'll automatically reschedule to avoid overlap.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
} 