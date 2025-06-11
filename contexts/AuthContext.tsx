'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, refreshSession, getSessionStatus } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        } else {
          console.log('Initial session:', session ? 'Found' : 'None')
        }
        
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'Session exists' : 'No session')
        
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    // Set up automatic session refresh every 12 hours (for 48-hour sessions)
    const refreshInterval = setInterval(async () => {
      if (!isMounted) return
      
      const status = await getSessionStatus()
      if (status.isValid && status.timeUntilExpiry < 6 * 60 * 60 * 1000) { // If less than 6 hours left
        console.log('Refreshing session automatically...')
        await refreshSession()
      }
    }, 12 * 60 * 60 * 1000) // Check every 12 hours

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [mounted])

  const signOut = async () => {
    try {
      console.log('Signing out...')
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  // Don't render anything until mounted on client
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl text-gray-600">Loading...</div>
    </div>
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}