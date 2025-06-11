import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/groups'
import { getMonthlyLeaderboard } from '../../lib/scores'
import { getGolfScoreColor } from '../../lib/golf-scoring'
import { getActiveTournament, getTournamentLeaderboard, getTournamentDay, getTournamentDayName, isCutDay } from '../../lib/tournaments'

export default function LeaderboardScreen() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('net') // 'net' or 'raw'
  const [activeTournament, setActiveTournament] = useState(null)
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState([])

  useEffect(() => {
    loadGroups()
    checkForActiveTournament()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      if (activeTournament) {
        loadTournamentLeaderboard()
      } else {
        loadLeaderboard()
      }
    }
  }, [selectedGroup, currentDate, activeTournament])

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

  const checkForActiveTournament = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tournament = await getActiveTournament(today)
      setActiveTournament(tournament)
    } catch (error) {
      console.error('Error checking for active tournament:', error)
    }
  }

  const loadLeaderboard = async () => {
    if (!selectedGroup) return
    
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const data = await getMonthlyLeaderboard(selectedGroup.id, year, month)
      setLeaderboard(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load leaderboard')
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTournamentLeaderboard = async () => {
    if (!selectedGroup || !activeTournament) return
    
    setLoading(true)
    try {
      const data = await getTournamentLeaderboard(activeTournament.id, selectedGroup.id)
      setTournamentLeaderboard(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load tournament leaderboard')
      console.error('Error loading tournament leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500' // Gold
      case 2: return 'text-gray-400'   // Silver
      case 3: return 'text-amber-600'  // Bronze
      default: return 'text-gray-600'
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return 'trophy'
      case 2: return 'medal'
      case 3: return 'medal'
      default: return 'person'
    }
  }

  const getTournamentStatusText = () => {
    if (!activeTournament) return null
    
    const today = new Date().toISOString().split('T')[0]
    const tournamentDay = getTournamentDay(activeTournament.start_date, today)
    
    if (isCutDay(activeTournament.start_date, today)) {
      return 'Cut Day - No Play Today'
    }
    
    if (tournamentDay) {
      return getTournamentDayName(tournamentDay)
    }
    
    return 'Tournament Active'
  }

  const getBirthdayMessage = () => {
    if (!activeTournament || activeTournament.tournament_type !== 'birthday') return null
    
    const birthdayPerson = tournamentLeaderboard.find(p => p.profiles.id === activeTournament.birthday_user_id)
    if (!birthdayPerson) return null
    
    return `🎂 ${birthdayPerson.profiles.display_name} gets a ${activeTournament.birthday_advantage} stroke advantage!`
  }

  const sortedLeaderboard = activeTournament 
    ? tournamentLeaderboard.sort((a, b) => (a.qualifying_total || 999) - (b.qualifying_total || 999))
    : viewType === 'net' 
      ? leaderboard.sort((a, b) => a.avgNetScore - b.avgNetScore)
      : leaderboard.sort((a, b) => a.avgRawScore - b.avgRawScore)

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white p-4 border-b border-gray-200">
          {activeTournament ? (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons 
                  name={activeTournament.tournament_type === 'birthday' ? 'gift' : 'trophy'} 
                  size={24} 
                  color="#0ea5e9" 
                />
                <Text className="text-2xl font-bold text-gray-900 ml-2">
                  {activeTournament.name}
                </Text>
              </View>
              <Text className="text-gray-600 mb-1">{activeTournament.venue}</Text>
              <Text className="text-primary-600 font-medium">{getTournamentStatusText()}</Text>
              {getBirthdayMessage() && (
                <Text className="text-orange-600 font-medium mt-1">{getBirthdayMessage()}</Text>
              )}
            </View>
          ) : (
            <Text className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</Text>
          )}
          
          {/* Group Selection */}
          {groups.length > 1 && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Group</Text>
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

          {/* Month Navigation - only show for regular leaderboard */}
          {!activeTournament && (
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => navigateMonth(-1)}
                className="p-2"
              >
                <Ionicons name="chevron-back" size={24} color="#374151" />
              </TouchableOpacity>
              
              <Text className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity
                onPress={() => navigateMonth(1)}
                className="p-2"
              >
                <Ionicons name="chevron-forward" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          )}

          {/* View Type Toggle - only show for regular leaderboard */}
          {!activeTournament && (
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                onPress={() => setViewType('net')}
                className={`flex-1 py-2 rounded-md ${
                  viewType === 'net' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text className={`text-center font-medium ${
                  viewType === 'net' ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  Net Scores
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewType('raw')}
                className={`flex-1 py-2 rounded-md ${
                  viewType === 'raw' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text className={`text-center font-medium ${
                  viewType === 'raw' ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  Raw Scores
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Leaderboard */}
        <View className="p-4">
          {!selectedGroup ? (
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Text className="text-yellow-800">
                Select a group to view the leaderboard
              </Text>
            </View>
          ) : loading ? (
            <View className="flex-1 justify-center items-center py-12">
              <Text className="text-gray-600">Loading leaderboard...</Text>
            </View>
          ) : sortedLeaderboard.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="trophy-outline" size={64} color="#9ca3af" />
              <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
                {activeTournament ? 'No Tournament Participants Yet' : 'No Scores Yet'}
              </Text>
              <Text className="text-gray-600 text-center">
                {activeTournament 
                  ? 'Submit a score to join the tournament!' 
                  : 'No one has submitted scores for this month yet.'
                }
              </Text>
            </View>
          ) : (
            <View>
              {/* Cut Line Indicator for Tournament */}
              {activeTournament && (
                <View className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Text className="text-blue-900 font-medium text-center">
                    Cut Line: Top {Math.ceil(sortedLeaderboard.length * 0.5)} advance to weekend
                  </Text>
                </View>
              )}

              {sortedLeaderboard.map((player, index) => {
                const position = index + 1
                const isCurrentUser = player.user?.id === user?.id || player.profiles?.id === user?.id
                const isBirthdayPerson = activeTournament?.birthday_user_id === (player.profiles?.id || player.user?.id)
                const madeCut = activeTournament ? player.made_cut : true
                const aboveCutLine = activeTournament ? position <= Math.ceil(sortedLeaderboard.length * 0.5) : true
                
                let displayScore
                if (activeTournament) {
                  displayScore = player.qualifying_total || 0
                } else {
                  displayScore = viewType === 'net' ? player.avgNetScore : player.avgRawScore
                }
                
                return (
                  <View
                    key={player.user?.id || player.profiles?.id || index}
                    className={`rounded-lg p-4 mb-3 border ${
                      isCurrentUser 
                        ? 'border-primary-300 bg-primary-50' 
                        : madeCut || aboveCutLine
                          ? 'border-gray-200 bg-white'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <View className="flex-row items-center">
                      {/* Position */}
                      <View className="w-12 items-center">
                        <Ionicons
                          name={getPositionIcon(position)}
                          size={24}
                          color={getPositionColor(position).replace('text-', '#')}
                        />
                        <Text className={`font-bold ${getPositionColor(position)}`}>
                          #{position}
                        </Text>
                      </View>

                      {/* Player Info */}
                      <View className="flex-1 ml-4">
                        <View className="flex-row items-center">
                          <Text className={`text-lg font-semibold ${
                            isCurrentUser ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {player.user?.display_name || player.profiles?.display_name || player.user?.email}
                          </Text>
                          {isCurrentUser && (
                            <Text className="text-primary-600 text-sm ml-1"> (You)</Text>
                          )}
                          {isBirthdayPerson && (
                            <Text className="text-orange-600 text-sm ml-1"> 🎂</Text>
                          )}
                        </View>
                        <Text className="text-gray-600">
                          {activeTournament 
                            ? `${player.qualifying_total ? 4 : 0} rounds played`
                            : `${player.gamesPlayed} games • Handicap: ${player.handicap?.toFixed(1) || '0.0'}`
                          }
                        </Text>
                        {activeTournament && !madeCut && !aboveCutLine && (
                          <Text className="text-red-600 text-sm font-medium">Missed Cut</Text>
                        )}
                      </View>

                      {/* Score */}
                      <View className="items-end">
                        <Text className={`text-xl font-bold ${
                          activeTournament
                            ? displayScore < 0 ? 'text-green-600' : 
                              displayScore === 0 ? 'text-yellow-600' : 'text-red-600'
                            : displayScore < 0 ? 'text-green-600' : 
                              displayScore === 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {displayScore > 0 ? '+' : ''}{displayScore?.toFixed(1)}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {activeTournament 
                            ? 'Qualifying'
                            : viewType === 'net' ? 'Net Avg' : 'Raw Avg'
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
} 