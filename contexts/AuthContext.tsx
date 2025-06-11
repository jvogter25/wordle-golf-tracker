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

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        } else if (initialSession && isMounted) {
          console.log('Initial session found:', initialSession.user.email)
          setSession(initialSession)
          setUser(initialSession.user)
        } else {
          console.log('No initial session found')
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event, newSession?.user?.email || 'no user')
        
        if (!isMounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
            console.log('User signed in:', newSession.user.email)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          console.log('User signed out')
        }
        
        setLoading(false)
      }
    )

    // Auto-refresh session every 30 minutes
    const refreshInterval = setInterval(async () => {
      if (!isMounted) return
      
      const status = await getSessionStatus()
      if (status.isValid && status.timeUntilExpiry < 12 * 60 * 60 * 1000) { // 12 hours
        console.log('Auto-refreshing session')
        await refreshSession()
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [mounted])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        setSession(null)
        setUser(null)
        console.log('Successfully signed out')
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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