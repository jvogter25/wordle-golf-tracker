import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'
import { 
  getActiveTournament, 
  getUpcomingTournaments, 
  getTournamentHistory,
  createMajorTournaments,
  createBirthdayTournaments
} from '../../lib/tournaments'

export default function TournamentsScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [activeTournament, setActiveTournament] = useState(null)
  const [upcomingTournaments, setUpcomingTournaments] = useState([])
  const [tournamentHistory, setTournamentHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadGroups()
    checkActiveTournament()
    loadUpcomingTournaments()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadTournamentHistory()
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

  const checkActiveTournament = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tournament = await getActiveTournament(today)
      setActiveTournament(tournament)
    } catch (error) {
      console.error('Error checking active tournament:', error)
    }
  }

  const loadUpcomingTournaments = async () => {
    try {
      const tournaments = await getUpcomingTournaments('', 10)
      setUpcomingTournaments(tournaments)
    } catch (error) {
      console.error('Error loading upcoming tournaments:', error)
    }
  }

  const loadTournamentHistory = async () => {
    if (!selectedGroup) return
    
    try {
      const history = await getTournamentHistory(selectedGroup.id, new Date().getFullYear())
      setTournamentHistory(history)
    } catch (error) {
      console.error('Error loading tournament history:', error)
    }
  }

  const handleCreateYearlyTournaments = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group first')
      return
    }

    setLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      
      // Create major tournaments
      await createMajorTournaments(currentYear)
      
      // Create birthday tournaments for this group
      await createBirthdayTournaments(selectedGroup.id, currentYear)
      
      Alert.alert(
        'Success!', 
        `Created ${currentYear} tournament schedule for ${selectedGroup.name}`
      )
      
      // Refresh data
      loadUpcomingTournaments()
      loadTournamentHistory()
    } catch (error) {
      Alert.alert('Error', 'Failed to create tournaments: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTournamentDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTournamentIcon = (tournamentType: string) => {
    return tournamentType === 'birthday' ? 'gift' : 'trophy'
  }

  const getTournamentColor = (tournamentType: string) => {
    return tournamentType === 'birthday' ? 'text-orange-500' : 'text-blue-500'
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-gray-900">Tournaments</Text>
          <TouchableOpacity 
            onPress={() => router.push('/tournaments/birthday-preferences')}
            className="p-2"
          >
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
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

        {/* Active Tournament */}
        {activeTournament && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Active Tournament</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/leaderboard')}
              className="bg-white rounded-lg p-4 border border-primary-200 border-l-4 border-l-primary-500"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ionicons 
                      name={getTournamentIcon(activeTournament.tournament_type)} 
                      size={20} 
                      color="#0ea5e9" 
                    />
                    <Text className="text-lg font-bold text-gray-900 ml-2">
                      {activeTournament.name}
                    </Text>
                  </View>
                  <Text className="text-gray-600 mb-1">{activeTournament.venue}</Text>
                  <Text className="text-primary-600 font-medium">
                    {formatTournamentDate(activeTournament.start_date)} - {formatTournamentDate(activeTournament.end_date)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Create Tournaments Button */}
        {selectedGroup && (
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleCreateYearlyTournaments}
              disabled={loading}
              className={`py-3 px-4 rounded-lg border border-dashed border-gray-300 ${
                loading ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="add-circle-outline" 
                  size={20} 
                  color={loading ? '#9ca3af' : '#0ea5e9'} 
                />
                <Text className={`ml-2 font-medium ${
                  loading ? 'text-gray-500' : 'text-primary-600'
                }`}>
                  {loading ? 'Creating Tournaments...' : `Create ${new Date().getFullYear()} Tournament Schedule`}
                </Text>
              </View>
            </TouchableOpacity>
            <Text className="text-gray-600 text-sm mt-2 text-center">
              Creates 4 major tournaments + birthday tournaments for all group members
            </Text>
          </View>
        )}

        {/* Upcoming Tournaments */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Upcoming Tournaments</Text>
          {upcomingTournaments.length === 0 ? (
            <View className="bg-gray-100 rounded-lg p-4">
              <Text className="text-gray-600 text-center">
                No upcoming tournaments scheduled
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {upcomingTournaments.map((tournament) => (
                <View 
                  key={tournament.id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons 
                      name={getTournamentIcon(tournament.tournament_type)} 
                      size={18} 
                      color={getTournamentColor(tournament.tournament_type)} 
                    />
                    <Text className="text-base font-semibold text-gray-900 ml-2">
                      {tournament.name}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm mb-1">
                    {tournament.venue}
                  </Text>
                  <Text className="text-gray-700 text-sm">
                    {formatTournamentDate(tournament.start_date)} - {formatTournamentDate(tournament.end_date)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tournament History */}
        {selectedGroup && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Tournament History ({new Date().getFullYear()})
            </Text>
            {tournamentHistory.length === 0 ? (
              <View className="bg-gray-100 rounded-lg p-4">
                <Text className="text-gray-600 text-center">
                  No completed tournaments yet
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {tournamentHistory.map((participant) => {
                  const tournament = participant.tournaments
                  const profile = participant.profiles
                  
                  return (
                    <View 
                      key={`${tournament.id}-${participant.id}`}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2">
                            <Ionicons 
                              name={getTournamentIcon(tournament.tournament_type)} 
                              size={16} 
                              color={getTournamentColor(tournament.tournament_type)} 
                            />
                            <Text className="text-base font-semibold text-gray-900 ml-2">
                              {tournament.name}
                            </Text>
                          </View>
                          <Text className="text-gray-600 text-sm">
                            {formatTournamentDate(tournament.start_date)}
                          </Text>
                          {participant.final_position && (
                            <Text className="text-primary-600 text-sm font-medium">
                              {participant.prize_description || `#${participant.final_position}`}
                            </Text>
                          )}
                        </View>
                        
                        {participant.final_position === 1 && (
                          <Ionicons name="trophy" size={24} color="#fbbf24" />
                        )}
                        {participant.final_position === 2 && (
                          <Ionicons name="medal" size={24} color="#9ca3af" />
                        )}
                        {participant.final_position === 3 && (
                          <Ionicons name="medal" size={24} color="#d97706" />
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Tournament Information */}
        <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <Text className="text-blue-900 font-medium mb-2">About Tournaments</Text>
          <Text className="text-blue-800 text-sm leading-5 mb-3">
            🏆 <Text className="font-medium">Major Tournaments:</Text> Four prestigious events held throughout the year matching real golf majors
          </Text>
          <Text className="text-blue-800 text-sm leading-5 mb-3">
            🎂 <Text className="font-medium">Birthday Tournaments:</Text> Personal celebrations where the birthday person gets a 0.5 stroke advantage
          </Text>
          <Text className="text-blue-800 text-sm leading-5">
            All tournaments run Monday-Thursday (qualifying) with a cut, then Saturday-Sunday (championship rounds). No play on Fridays!
          </Text>
        </View>
      </View>
    </ScrollView>
  )
} 