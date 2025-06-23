import { SupabaseClient } from '@supabase/supabase-js'
import { Tournament, TournamentParticipant } from './supabase'

// Simplified tournament system - admin creates tournaments manually

export async function getTournamentsByGroup(client: SupabaseClient, groupId: string) {
  const { data, error } = await client
    .from('tournaments')
    .select(`
      *,
      profiles:birthday_user_id (display_name)
    `)
    .eq('group_id', groupId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getActiveTournaments(client: SupabaseClient, groupId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await client
    .from('tournaments')
    .select(`
      *,
      profiles:birthday_user_id (display_name)
    `)
    .eq('group_id', groupId)
    .lte('start_date', today)
    .gte('end_date', today)
    .eq('is_active', true)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getUpcomingTournaments(client: SupabaseClient, groupId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await client
    .from('tournaments')
    .select(`
      *,
      profiles:birthday_user_id (display_name)
    `)
    .eq('group_id', groupId)
    .gt('start_date', today)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getPastTournaments(client: SupabaseClient, groupId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await client
    .from('tournaments')
    .select(`
      *,
      profiles:birthday_user_id (display_name)
    `)
    .eq('group_id', groupId)
    .lt('end_date', today)
    .order('end_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getTournamentById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('tournaments')
    .select(`
      *,
      profiles:birthday_user_id (display_name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTournament(
  client: SupabaseClient,
  tournamentData: {
    name: string
    tournament_type: 'birthday' | 'major'
    group_id: string
    start_date: string
    end_date: string
    venue?: string
    birthday_user_id?: string
    birthday_advantage?: number
  }
) {
  const year = new Date(tournamentData.start_date).getFullYear()
  
  const { data, error } = await client
    .from('tournaments')
    .insert({
      ...tournamentData,
      year,
      venue: tournamentData.venue || 'Wordle Golf',
      is_active: true,
      birthday_advantage: tournamentData.tournament_type === 'birthday' ? 
        (tournamentData.birthday_advantage || -2.0) : 0.0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTournament(
  client: SupabaseClient,
  tournamentId: string,
  updates: Partial<Tournament>
) {
  const { data, error } = await client
    .from('tournaments')
    .update(updates)
    .eq('id', tournamentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTournament(client: SupabaseClient, tournamentId: string) {
  const { error } = await client
    .from('tournaments')
    .delete()
    .eq('id', tournamentId)

  if (error) throw error
}

export async function getTournamentLeaderboard(client: SupabaseClient, tournamentId: string) {
  const { data, error } = await client.rpc('get_tournament_leaderboard', {
    tournament_id_param: tournamentId
  })

  if (error) throw error
  return data
}

export async function getGroupMembers(client: SupabaseClient, groupId: string) {
  const { data, error } = await client
    .from('group_members')
    .select(`
      user_id,
      profiles (id, display_name, email)
    `)
    .eq('group_id', groupId)

  if (error) throw error
  return data
}

// Utility functions
export const getTournamentDay = (tournamentStartDate: string, currentDate: string): number | null => {
  const start = new Date(tournamentStartDate)
  const current = new Date(currentDate)
  const daysDiff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Map to tournament days (skip Friday)
  const dayOfWeek = current.getDay()
  if (dayOfWeek === 5) return null // Friday - no tournament play
  
  if (dayOfWeek === 1) return 1 // Monday
  if (dayOfWeek === 2) return 2 // Tuesday
  if (dayOfWeek === 3) return 3 // Wednesday
  if (dayOfWeek === 4) return 4 // Thursday
  if (dayOfWeek === 6) return 5 // Saturday
  if (dayOfWeek === 0) return 6 // Sunday
  
  return null
}

export const isTournamentDay = (tournamentStartDate: string, currentDate: string): boolean => {
  return getTournamentDay(tournamentStartDate, currentDate) !== null
}

export const getTournamentDayName = (tournamentDay: number): string => {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday']
  return days[tournamentDay] || 'Unknown'
}

export const isCutDay = (tournamentStartDate: string, currentDate: string): boolean => {
  const tournamentDay = getTournamentDay(tournamentStartDate, currentDate)
  return tournamentDay === 4 // Thursday is cut day
} 