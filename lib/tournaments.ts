import { SupabaseClient } from '@supabase/supabase-js'
import { Tournament, TournamentParticipant, BirthdayTournamentPreferences } from './supabase'

// Major tournament schedule for 2025 (will need to be updated annually)
const MAJOR_TOURNAMENTS_2025 = [
  {
    name: "The Masters",
    start_date: "2025-04-10",
    end_date: "2025-04-13",
    type: "major",
    status: "upcoming"
  },
  {
    name: "PGA Championship",
    start_date: "2025-05-15",
    end_date: "2025-05-18",
    type: "major",
    status: "upcoming"
  },
  {
    name: "U.S. Open",
    start_date: "2025-06-12",
    end_date: "2025-06-15",
    type: "major",
    status: "upcoming"
  },
  {
    name: "The Open Championship",
    start_date: "2025-07-17",
    end_date: "2025-07-20",
    type: "major",
    status: "upcoming"
  }
]

export async function getUpcomingTournaments(client: SupabaseClient) {
  const { data, error } = await client
    .from('tournaments')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getActiveTournaments(client: SupabaseClient) {
  const today = new Date().toISOString()
  const { data, error } = await client
    .from('tournaments')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getPastTournaments(client: SupabaseClient) {
  const { data, error } = await client
    .from('tournaments')
    .select('*')
    .lt('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getTournamentById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getTournamentParticipants(client: SupabaseClient, tournamentId: string) {
  const { data, error } = await client
    .from('tournament_participants')
    .select(`
      *,
      profiles (display_name)
    `)
    .eq('tournament_id', tournamentId)
    .order('qualifying_total', { ascending: true })

  if (error) throw error
  return data
}

export async function joinTournament(client: SupabaseClient, tournamentId: string, userId: string) {
  const { error } = await client
    .from('tournament_participants')
    .insert({
      tournament_id: tournamentId,
      user_id: userId,
      joined_at: new Date().toISOString()
    })

  if (error) throw error
}

export async function leaveTournament(client: SupabaseClient, tournamentId: string, userId: string) {
  const { error } = await client
    .from('tournament_participants')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function submitTournamentScore(
  client: SupabaseClient,
  tournamentId: string,
  userId: string,
  score: number,
  puzzleDate: string
) {
  const { error } = await client
    .from('tournament_scores')
    .insert({
      tournament_id: tournamentId,
      user_id: userId,
      score,
      puzzle_date: puzzleDate,
      submitted_at: new Date().toISOString()
    })

  if (error) throw error
}

export async function getTournamentScores(
  client: SupabaseClient,
  tournamentId: string,
  userId: string
) {
  const { data, error } = await client
    .from('tournament_scores')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userId)
    .order('puzzle_date', { ascending: true })

  if (error) throw error
  return data
}

export async function calculateTournamentCut(client: SupabaseClient, tournamentId: string) {
  const { error } = await client.rpc('calculate_tournament_cut', {
    tournament_id: tournamentId
  })
  if (error) throw error
}

export async function getBirthdayTournamentPreferences(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('birthday_tournament_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateBirthdayTournamentPreferences(
  client: SupabaseClient,
  userId: string,
  preferences: BirthdayTournamentPreferences
) {
  const { error } = await client
    .from('birthday_tournament_preferences')
    .upsert({
      user_id: userId,
      ...preferences
    })

  if (error) throw error
}

export async function createBirthdayTournament(
  client: SupabaseClient,
  userId: string,
  preferences: BirthdayTournamentPreferences
) {
  const { error } = await client
    .from('tournaments')
    .insert({
      name: `${preferences.display_name}'s Birthday Tournament`,
      start_date: preferences.start_date,
      end_date: preferences.end_date,
      type: 'birthday',
      created_by: userId,
      status: 'upcoming'
    })

  if (error) throw error
}

export async function getTournamentLeaderboard(client: SupabaseClient, tournamentId: string) {
  const { data, error } = await client.rpc('get_tournament_leaderboard', {
    tournament_id: tournamentId
  })

  if (error) throw error
  return data
}

export async function generateBirthdayTournaments(supabase: SupabaseClient) {
  // Get all users with birthday preferences
  const { data: preferences, error: prefsError } = await supabase
    .from('birthday_tournament_preferences')
    .select('*')

  if (prefsError) throw prefsError

  const today = new Date()
  const results = []

  for (const pref of preferences) {
    const birthday = new Date(pref.birthday)
    const isBirthdayMonth = birthday.getMonth() === today.getMonth()
    const isBirthdayDay = birthday.getDate() === today.getDate()

    if (isBirthdayMonth && isBirthdayDay) {
      try {
        const tournament = await createBirthdayTournament(supabase, pref.user_id, pref)
        results.push({ success: true, tournament })
      } catch (error) {
        results.push({ success: false, error, userId: pref.user_id })
      }
    }
  }

  return results
}

export async function getMajorTournaments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_major', true)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function createMajorTournaments(supabase: SupabaseClient) {
  const results = []

  for (const tournament of MAJOR_TOURNAMENTS_2025) {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournament])
        .select()
        .single()

      if (error) throw error
      results.push({ success: true, tournament: data })
    } catch (error) {
      results.push({ success: false, error, tournament })
    }
  }

  return results
}

// Create birthday tournaments for all group members
export const createBirthdayTournaments = async (groupId: string, year: number) => {
  // Get all group members with birthdays
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles (
        id,
        display_name,
        birth_month,
        birth_day
      )
    `)
    .eq('group_id', groupId)

  if (membersError) throw membersError

  const birthdayTournaments = []

  for (const member of members) {
    const profile = member.profiles as any
    if (!profile.birth_month || !profile.birth_day) continue

    // Get user preferences for this group
    const { data: preferences } = await supabase
      .from('birthday_tournament_preferences')
      .select('*')
      .eq('user_id', profile.id)
      .eq('group_id', groupId)
      .single()

    if (preferences && !preferences.enable_birthday_tournaments) continue

    // Calculate tournament week
    const birthdayDate = new Date(year, profile.birth_month - 1, profile.birth_day)
    const tournamentStart = getWeekStart(birthdayDate)
    
    // Apply week offset if user has preferences
    if (preferences?.preferred_week_offset) {
      tournamentStart.setDate(tournamentStart.getDate() + (preferences.preferred_week_offset * 7))
    }

    // Check for conflicts with major tournaments
    const hasConflict = await checkMajorTournamentConflict(tournamentStart, year)
    if (hasConflict) {
      // Move to week before birthday
      tournamentStart.setDate(tournamentStart.getDate() - 7)
    }

    const tournamentName = preferences?.custom_tournament_name || 
      `${profile.display_name}'s Birthday Championship`

    const advantage = preferences?.preferred_advantage || 0.5

    birthdayTournaments.push({
      name: tournamentName,
      tournament_type: 'birthday' as const,
      year,
      start_date: formatDate(tournamentStart),
      end_date: addDays(formatDate(tournamentStart), 6),
      venue: `${profile.display_name}'s Home Course`,
      is_active: false,
      birthday_user_id: profile.id,
      birthday_advantage: advantage
    })
  }

  if (birthdayTournaments.length === 0) return []

  const { data, error } = await supabase
    .from('tournaments')
    .insert(birthdayTournaments)
    .select()

  if (error) throw error
  return data
}

// Get active tournament for a specific date
export const getActiveTournament = async (date: string) => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .lte('start_date', date)
    .gte('end_date', date)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}

// Get tournament leaderboard
export const getTournamentLeaderboard = async (tournamentId: string, groupId: string) => {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      ),
      tournaments (
        id,
        name,
        tournament_type,
        birthday_user_id,
        birthday_advantage
      )
    `)
    .eq('tournament_id', tournamentId)
    .eq('group_id', groupId)
    .order('qualifying_total', { ascending: true })

  if (error) throw error

  // Get tournament scores for each participant
  const participantsWithScores = await Promise.all(
    data.map(async (participant) => {
      const { data: scores } = await supabase
        .from('tournament_scores')
        .select('*')
        .eq('tournament_id', tournamentId)
        .in('score_id', [
          // Get score IDs for this user/group
        ])

      return {
        ...participant,
        daily_scores: scores || []
      }
    })
  )

  return participantsWithScores
}

// Activate tournaments based on current date
export const activateTournaments = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  // Activate tournaments that should be active today
  const { error: activateError } = await supabase
    .from('tournaments')
    .update({ is_active: true })
    .lte('start_date', today)
    .gte('end_date', today)
    .eq('is_active', false)

  if (activateError) throw activateError

  // Deactivate tournaments that have ended
  const { error: deactivateError } = await supabase
    .from('tournaments')
    .update({ is_active: false })
    .lt('end_date', today)
    .eq('is_active', true)

  if (deactivateError) throw deactivateError
}

// Get upcoming tournaments
export const getUpcomingTournaments = async (groupId: string, limit: number = 5) => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .gt('start_date', today)
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

// Get tournament history for a group
export const getTournamentHistory = async (groupId: string, year?: number) => {
  let query = supabase
    .from('tournament_participants')
    .select(`
      *,
      tournaments (
        id,
        name,
        tournament_type,
        start_date,
        end_date,
        venue,
        birthday_user_id
      ),
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .not('final_position', 'is', null)
    .order('tournaments(start_date)', { ascending: false })

  if (year) {
    query = query.eq('tournaments.year', year)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Manage birthday tournament preferences
export const updateBirthdayPreferences = async (
  userId: string, 
  groupId: string, 
  preferences: Partial<BirthdayTournamentPreferences>
) => {
  const { data, error } = await supabase
    .from('birthday_tournament_preferences')
    .upsert({
      user_id: userId,
      group_id: groupId,
      ...preferences
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getBirthdayPreferences = async (userId: string, groupId: string) => {
  const { data, error } = await supabase
    .from('birthday_tournament_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Utility functions
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

async function checkMajorTournamentConflict(proposedDate: Date, year: number): Promise<boolean> {
  const startDate = formatDate(proposedDate)
  const endDate = addDays(startDate, 6)

  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .eq('tournament_type', 'major')
    .eq('year', year)
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

  if (error) throw error
  return (data?.length || 0) > 0
}

// Tournament day helpers
export const getTournamentDay = (tournamentStartDate: string, currentDate: string): number | null => {
  const start = new Date(tournamentStartDate)
  const current = new Date(currentDate)
  const daysDiff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Tournament runs Mon-Thu (days 0-3) and Sat-Sun (days 5-6)
  // Friday (day 4) is rest day
  if (daysDiff < 0 || daysDiff > 6) return null
  if (daysDiff === 4) return null // Friday - no play
  
  return daysDiff >= 5 ? daysDiff - 1 : daysDiff + 1 // Adjust for Friday gap
}

export const isTournamentDay = (tournamentStartDate: string, currentDate: string): boolean => {
  return getTournamentDay(tournamentStartDate, currentDate) !== null
}

export const getTournamentDayName = (tournamentDay: number): string => {
  const dayNames = {
    1: 'First Round',
    2: 'Second Round', 
    3: 'Third Round',
    4: 'Fourth Round',
    5: 'Championship Saturday',
    6: 'Championship Sunday'
  }
  return dayNames[tournamentDay] || 'Tournament Day'
}

export const isCutDay = (tournamentStartDate: string, currentDate: string): boolean => {
  const start = new Date(tournamentStartDate)
  const current = new Date(currentDate)
  const daysDiff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysDiff === 4 // Friday
} 