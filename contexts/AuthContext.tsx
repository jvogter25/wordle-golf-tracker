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
        console.log('🔄 AuthContext: Initializing auth...')
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthContext: Error getting initial session:', error)
        } else if (initialSession && isMounted) {
          console.log('✅ AuthContext: Initial session found:', initialSession.user.email)
          console.log('✅ AuthContext: Session expires at:', new Date(initialSession.expires_at! * 1000).toLocaleString())
          setSession(initialSession)
          setUser(initialSession.user)
        } else {
          console.log('ℹ️ AuthContext: No initial session found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error in initializeAuth:', error)
      } finally {
        if (isMounted) {
          console.log('✅ AuthContext: Auth initialization complete, setting loading to false')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 AuthContext: Auth state change:', event, newSession?.user?.email || 'no user')
        
        if (!isMounted) return

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession) {
            console.log('✅ AuthContext: User signed in:', newSession.user.email)
            console.log('✅ AuthContext: New session expires at:', new Date(newSession.expires_at! * 1000).toLocaleString())
            setSession(newSession)
            setUser(newSession.user)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ AuthContext: User signed out')
          setSession(null)
          setUser(null)
        }
        
        // Always set loading to false after any auth state change
        setLoading(false)
      }
    )

    // Auto-refresh session every 30 minutes
    const refreshInterval = setInterval(async () => {
      if (!isMounted) return
      
      const status = await getSessionStatus()
      if (status.isValid && status.timeUntilExpiry < 12 * 60 * 60 * 1000) { // 12 hours
        console.log('🔄 AuthContext: Auto-refreshing session')
        await refreshSession()
      }
    }, 30 * 60 * 1000) // 30 minutes

    // Failsafe: ensure loading doesn't stay true forever
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⚠️ AuthContext: Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 10000) // 10 seconds max loading time

    // Additional check: periodically verify session is still valid
    const sessionCheckInterval = setInterval(async () => {
      if (!isMounted || !session) return
      
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error || !currentSession) {
          console.log('⚠️ AuthContext: Session no longer valid, clearing state')
          setSession(null)
          setUser(null)
        } else if (currentSession.user.id !== session.user.id) {
          console.log('🔄 AuthContext: Session user changed, updating state')
          setSession(currentSession)
          setUser(currentSession.user)
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking session validity:', error)
      }
    }, 60000) // Check every minute

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
      clearInterval(sessionCheckInterval)
      clearTimeout(loadingTimeout)
    }
  }, [mounted, loading, session])

  const signOut = async () => {
    try {
      setLoading(true)
      console.log('🔄 AuthContext: Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ AuthContext: Error signing out:', error)
      } else {
        setSession(null)
        setUser(null)
        console.log('✅ AuthContext: Successfully signed out')
      }
    } catch (error) {
      console.error('❌ AuthContext: Unexpected error during sign out:', error)
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

  // Debug info
  console.log('🔍 AuthContext render:', { 
    user: user?.email || 'none', 
    loading, 
    sessionValid: !!session,
    mounted 
  })

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