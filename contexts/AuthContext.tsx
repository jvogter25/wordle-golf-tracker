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
    
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext: Initializing auth...')
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthContext: Error getting initial session:', error)
        } else if (initialSession) {
          console.log('✅ AuthContext: Initial session found:', initialSession.user.email)
          setSession(initialSession)
          setUser(initialSession.user)
        } else {
          console.log('ℹ️ AuthContext: No initial session found')
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 AuthContext: Auth state change:', event, session?.user?.email || 'no user')
            
            if (session) {
              console.log('✅ AuthContext: Session updated:', {
                user: session.user.email,
                expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
              })
              setSession(session)
              setUser(session.user)
            } else {
              console.log('ℹ️ AuthContext: Session cleared')
              setSession(null)
              setUser(null)
            }
            
            // Always set loading to false after any auth state change
            setLoading(false)
          }
        )

        // Set loading to false after initial check, but with a longer timeout for magic link scenarios
        const timeoutId = setTimeout(() => {
          console.log('⏰ AuthContext: Loading timeout reached, forcing loading to false')
          setLoading(false)
        }, 8000) // Increased from 5000 to 8000ms to account for magic link delays

        // If we have a session immediately, clear the timeout
        if (initialSession) {
          clearTimeout(timeoutId)
          setLoading(false)
        }

        return () => {
          clearTimeout(timeoutId)
          subscription.unsubscribe()
        }
        
      } catch (error) {
        console.error('❌ AuthContext: Error in auth initialization:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Set up periodic session refresh (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        const expiresAt = new Date(currentSession.expires_at! * 1000)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        console.log('🔄 AuthContext: Session check - expires at:', expiresAt.toLocaleString())
        
        // Refresh if expires within 10 minutes
        if (timeUntilExpiry < 10 * 60 * 1000) {
          console.log('🔄 AuthContext: Session expiring soon, refreshing...')
          try {
            await refreshSession()
          } catch (error) {
            console.error('❌ AuthContext: Session refresh failed:', error)
          }
        }
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('🔄 AuthContext: Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ AuthContext: Sign out error:', error)
        throw error
      }
      console.log('✅ AuthContext: Successfully signed out')
      
      // Clear state immediately
      setUser(null)
      setSession(null)
      setLoading(false)
    } catch (error) {
      console.error('❌ AuthContext: Sign out failed:', error)
      throw error
    }
  }

  // Don't render children until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  const contextValue = {
    user,
    session,
    loading,
    signOut,
  }

  // Debug logging
  console.log('🔄 AuthContext render:', {
    user: user?.email || 'none',
    loading,
    sessionValid: session ? new Date(session.expires_at! * 1000) > new Date() : false,
    mounted
  })

  return (
    <AuthContext.Provider value={contextValue}>
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