import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'
import { submitScore, parseWordleResult } from '../../lib/scores'
import { getGolfScore } from '../../lib/golf-scoring'
import { getActiveTournament, getTournamentDay, getTournamentDayName, isCutDay } from '../../lib/tournaments'

export default function SubmitScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [attempts, setAttempts] = useState('')
  const [clipboardContent, setClipboardContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTournament, setActiveTournament] = useState(null)
  const [showTournamentInfo, setShowTournamentInfo] = useState(false)

  useEffect(() => {
    loadGroups()
    checkClipboard()
    checkForActiveTournament()
  }, [])

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

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync()
      if (content.includes('Wordle') && content.includes('/6')) {
        setClipboardContent(content)
      }
    } catch (error) {
      console.error('Error checking clipboard:', error)
    }
  }

  const checkForActiveTournament = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tournament = await getActiveTournament(today)
      setActiveTournament(tournament)
      
      if (tournament) {
        setShowTournamentInfo(true)
      }
    } catch (error) {
      console.error('Error checking for active tournament:', error)
    }
  }

  const parseFromClipboard = () => {
    if (!clipboardContent) return

    try {
      const result = parseWordleResult(clipboardContent)
      setAttempts(result.attempts.toString())
    } catch (error) {
      Alert.alert('Error', 'Could not parse Wordle result from clipboard')
    }
  }

  const handleSubmit = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group')
      return
    }

    if (!attempts) {
      Alert.alert('Error', 'Please enter number of attempts')
      return
    }

    const attemptsNum = parseInt(attempts)
    if (isNaN(attemptsNum) || attemptsNum < 1 || attemptsNum > 7) {
      Alert.alert('Error', 'Attempts must be between 1 and 7 (7 = failed)')
      return
    }

    setLoading(true)
    try {
      await submitScore(selectedGroup.id, attemptsNum)
      
      const golfScore = getGolfScore(attemptsNum)
      let successMessage = `Score submitted! ${golfScore} (${attemptsNum} ${attemptsNum === 1 ? 'attempt' : 'attempts'})`
      
      // Add tournament-specific messaging
      if (activeTournament) {
        const isBirthdayPerson = activeTournament.birthday_user_id === user?.id
        if (isBirthdayPerson) {
          const advantage = activeTournament.birthday_advantage
          const tournamentScore = Math.max(0, attemptsNum - advantage)
          successMessage += `\n🎂 Birthday advantage: -${advantage} strokes (Tournament score: ${tournamentScore})`
        }
        
        const today = new Date().toISOString().split('T')[0]
        const tournamentDay = getTournamentDay(activeTournament.start_date, today)
        if (tournamentDay) {
          successMessage += `\n🏆 ${getTournamentDayName(tournamentDay)} round submitted for ${activeTournament.name}`
        }
      }
      
      Alert.alert('Success!', successMessage)
      setAttempts('')
      setClipboardContent('')
    } catch (error) {
      console.error('Error submitting score:', error)
      Alert.alert('Error', error.message || 'Failed to submit score')
    } finally {
      setLoading(false)
    }
  }

  const getTournamentStatus = () => {
    if (!activeTournament) return null
    
    const today = new Date().toISOString().split('T')[0]
    
    if (isCutDay(activeTournament.start_date, today)) {
      return {
        message: 'Cut Day - No Tournament Play Today',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    }
    
    const tournamentDay = getTournamentDay(activeTournament.start_date, today)
    if (tournamentDay) {
      return {
        message: `${getTournamentDayName(tournamentDay)} - Tournament Active`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    }
    
    return null
  }

  const getBirthdayAdvantageInfo = () => {
    if (!activeTournament || activeTournament.tournament_type !== 'birthday') return null
    if (activeTournament.birthday_user_id !== user?.id) return null
    
    return {
      message: `🎂 You get a ${activeTournament.birthday_advantage} stroke advantage in your birthday tournament!`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  }

  const tournamentStatus = getTournamentStatus()
  const birthdayAdvantage = getBirthdayAdvantageInfo()
  const golfScore = attempts ? getGolfScore(parseInt(attempts) || 1) : ''

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-900 mb-6">Submit Score</Text>

        {/* Tournament Information */}
        {activeTournament && showTournamentInfo && (
          <View className="mb-6">
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons 
                    name={activeTournament.tournament_type === 'birthday' ? 'gift' : 'trophy'} 
                    size={20} 
                    color="#0ea5e9" 
                  />
                  <Text className="text-lg font-bold text-gray-900 ml-2">
                    {activeTournament.name}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowTournamentInfo(false)}
                  className="p-1"
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-gray-600 mb-2">{activeTournament.venue}</Text>
              
              {tournamentStatus && (
                <View className={`p-3 rounded-lg ${tournamentStatus.bgColor} ${tournamentStatus.borderColor} border mb-2`}>
                  <Text className={`font-medium ${tournamentStatus.color}`}>
                    {tournamentStatus.message}
                  </Text>
                </View>
              )}
              
              {birthdayAdvantage && (
                <View className={`p-3 rounded-lg ${birthdayAdvantage.bgColor} ${birthdayAdvantage.borderColor} border`}>
                  <Text className={`font-medium ${birthdayAdvantage.color}`}>
                    {birthdayAdvantage.message}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

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

        {/* Clipboard Parsing */}
        {clipboardContent && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Wordle Result Found in Clipboard
            </Text>
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-gray-600 text-sm mb-3">
                {clipboardContent.substring(0, 100)}...
              </Text>
              <TouchableOpacity
                onPress={parseFromClipboard}
                className="bg-primary-500 py-2 px-4 rounded-lg"
              >
                <Text className="text-white font-medium text-center">
                  Parse Result
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Manual Entry */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Manual Entry
          </Text>
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-gray-700 mb-2">Number of attempts (1-7):</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-lg"
              value={attempts}
              onChangeText={setAttempts}
              placeholder="Enter attempts..."
              keyboardType="numeric"
              maxLength={1}
            />
            {attempts && (
              <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                <Text className="text-gray-700">
                  Golf Score: <Text className="font-semibold">{golfScore}</Text>
                </Text>
                {activeTournament && activeTournament.birthday_user_id === user?.id && (
                  <Text className="text-orange-600 mt-1">
                    Tournament Score: <Text className="font-semibold">
                      {Math.max(0, (parseInt(attempts) || 0) - activeTournament.birthday_advantage)} 
                      (with {activeTournament.birthday_advantage} stroke birthday advantage)
                    </Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !selectedGroup || !attempts || (tournamentStatus?.message.includes('Cut Day'))}
          className={`py-4 rounded-lg ${
            loading || !selectedGroup || !attempts || (tournamentStatus?.message.includes('Cut Day'))
              ? 'bg-gray-300'
              : 'bg-primary-500'
          }`}
        >
          <Text className={`text-center font-semibold text-lg ${
            loading || !selectedGroup || !attempts || (tournamentStatus?.message.includes('Cut Day'))
              ? 'text-gray-500'
              : 'text-white'
          }`}>
            {loading ? 'Submitting...' : 'Submit Score'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <Text className="text-blue-900 font-medium mb-2">How to Submit</Text>
          <Text className="text-blue-800 text-sm leading-5">
            1. Complete today's Wordle puzzle{'\n'}
            2. Copy the result (share button){'\n'}
            3. Return to this app - we'll detect it automatically{'\n'}
            4. Or manually enter your number of attempts (1-7)
          </Text>
          {activeTournament && (
            <Text className="text-blue-800 text-sm leading-5 mt-2">
              🏆 Your score will count toward the {activeTournament.name}!
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  )
} 