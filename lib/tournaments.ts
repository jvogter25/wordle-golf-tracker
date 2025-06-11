import { supabase } from './supabase'
import { Tournament, TournamentParticipant, BirthdayTournamentPreferences } from './supabase'

// Major tournament schedule for 2025 (will need to be updated annually)
const MAJOR_TOURNAMENTS_2025 = [
  {
    name: "The Masters Tournament",
    start_date: "2025-04-07", // Monday of tournament week
    venue: "Augusta National Golf Club, Georgia"
  },
  {
    name: "PGA Championship",
    start_date: "2025-05-12", // Monday of tournament week  
    venue: "Quail Hollow Golf Club, North Carolina"
  },
  {
    name: "U.S. Open Championship",
    start_date: "2025-06-09", // Monday of tournament week
    venue: "Oakmont Country Club, Pennsylvania"
  },
  {
    name: "The Open Championship",
    start_date: "2025-07-14", // Monday of tournament week
    venue: "Royal Portrush Golf Club, Northern Ireland"
  }
]

// Create major tournaments for a given year
export const createMajorTournaments = async (year: number) => {
  const tournaments = MAJOR_TOURNAMENTS_2025.map(tournament => ({
    name: tournament.name,
    tournament_type: 'major' as const,
    year,
    start_date: tournament.start_date.replace('2025', year.toString()),
    end_date: addDays(tournament.start_date.replace('2025', year.toString()), 6),
    venue: tournament.venue,
    is_active: false,
    birthday_user_id: null,
    birthday_advantage: 0.0
  }))

  const { data, error } = await supabase
    .from('tournaments')
    .insert(tournaments)
    .select()

  if (error) throw error
  return data
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

// Calculate and apply tournament cut
export const calculateTournamentCut = async (tournamentId: string, groupId: string) => {
  // Use the database function to calculate cuts
  const { error } = await supabase.rpc('calculate_tournament_cut', {
    tournament_id_param: tournamentId,
    group_id_param: groupId
  })

  if (error) throw error

  // Get updated participants to return cut results
  const { data: participants } = await supabase
    .from('tournament_participants')
    .select(`
      *,
      profiles (display_name)
    `)
    .eq('tournament_id', tournamentId)
    .eq('group_id', groupId)
    .order('qualifying_total', { ascending: true })

  const qualifiers = participants?.filter(p => p.made_cut) || []
  const cutLine = qualifiers.length

  return {
    participants: participants || [],
    qualifiers,
    cutLine,
    totalParticipants: participants?.length || 0
  }
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