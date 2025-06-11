import { createClient } from '@supabase/supabase-js'

// Environment variables for Next.js web deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xneavnttdgrpltmmldit.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZWF2bnR0ZGdycGx0bW1sZGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTk3ODksImV4cCI6MjA2NTIzNTc4OX0.2T3VMVWWn7g-m8iYcoHq8r5ZkM8rWtLEZ2RXWttw3AA'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Web-compatible localStorage adapter
const webStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'wordle-golf-session',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'wordle-golf-tracker'
    }
  }
})

// Session management utilities
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.log('Session refresh error:', error.message)
      return false
    }
    return true
  } catch (error) {
    console.log('Session refresh failed:', error)
    return false
  }
}

export const getSessionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      isValid: !!session,
      expiresAt: session?.expires_at,
      refreshToken: session?.refresh_token,
      timeUntilExpiry: session?.expires_at ? (session.expires_at * 1000) - Date.now() : 0
    }
  } catch (error) {
    return { isValid: false, expiresAt: null, refreshToken: null, timeUntilExpiry: 0 }
  }
}

// Database types
export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  birth_month: number | null
  birth_day: number | null
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  invite_code: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  role: 'member' | 'admin'
}

export interface Score {
  id: string
  user_id: string
  group_id: string
  puzzle_date: string
  attempts: number
  golf_score: string
  raw_score: number
  submitted_at: string
}

export interface Handicap {
  id: string
  user_id: string
  group_id: string
  current_handicap: number
  games_played: number
  last_updated: string
}

export interface Tournament {
  id: string
  name: string
  tournament_type: 'major' | 'birthday'
  year: number
  start_date: string
  end_date: string
  venue: string
  is_active: boolean
  birthday_user_id: string | null
  birthday_advantage: number
  created_at: string
}

export interface TournamentParticipant {
  id: string
  tournament_id: string
  user_id: string
  group_id: string
  qualifying_total: number | null
  made_cut: boolean
  weekend_total: number | null
  final_total: number | null
  final_position: number | null
  prize_description: string | null
  created_at: string
}

export interface TournamentScore {
  id: string
  tournament_id: string
  score_id: string
  tournament_day: number
  is_qualifying_round: boolean
  tournament_score: number
  actual_score: number
  advantage_applied: number
  created_at: string
}

export interface BirthdayTournamentPreferences {
  id: string
  user_id: string
  group_id: string
  enable_birthday_tournaments: boolean
  custom_tournament_name: string | null
  preferred_week_offset: number
  preferred_advantage: number
  created_at: string
}