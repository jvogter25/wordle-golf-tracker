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
        
        // Get initial session with retry logic
        let initialSession = null
        let attempts = 0
        const maxAttempts = 3
        
        while (!initialSession && attempts < maxAttempts) {
          attempts++
          console.log(`🔄 AuthContext: Getting session attempt ${attempts}/${maxAttempts}`)
          
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error(`❌ AuthContext: Error getting session (attempt ${attempts}):`, error)
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
            }
          } else if (session) {
            initialSession = session
            console.log('✅ AuthContext: Initial session found:', session.user.email)
          } else {
            console.log(`ℹ️ AuthContext: No session found (attempt ${attempts})`)
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
            }
          }
        }
        
        if (initialSession) {
          // Validate session is not expired
          const now = Math.floor(Date.now() / 1000)
          if (initialSession.expires_at && initialSession.expires_at > now) {
            console.log('✅ AuthContext: Session is valid, expires at:', new Date(initialSession.expires_at * 1000).toLocaleString())
            setSession(initialSession)
            setUser(initialSession.user)
          } else {
            console.log('⚠️ AuthContext: Session expired, attempting refresh...')
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) throw refreshError
              
              if (refreshedSession) {
                console.log('✅ AuthContext: Session refreshed successfully')
                setSession(refreshedSession)
                setUser(refreshedSession.user)
              } else {
                console.log('ℹ️ AuthContext: No session after refresh')
                setSession(null)
                setUser(null)
              }
            } catch (refreshError) {
              console.error('❌ AuthContext: Session refresh failed:', refreshError)
              setSession(null)
              setUser(null)
            }
          }
        } else {
          console.log('ℹ️ AuthContext: No initial session found after all attempts')
          setSession(null)
          setUser(null)
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 AuthContext: Auth state change:', event, session?.user?.email || 'no user')
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session) {
                console.log('✅ AuthContext: Session updated:', {
                  user: session.user.email,
                  expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
                  event
                })
                setSession(session)
                setUser(session.user)
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('ℹ️ AuthContext: User signed out')
              setSession(null)
              setUser(null)
            }
            
            // Always set loading to false after any auth state change
            setLoading(false)
          }
        )

        // Set loading to false after initial check
        setLoading(false)

        return () => {
          subscription.unsubscribe()
        }
        
      } catch (error) {
        console.error('❌ AuthContext: Error in auth initialization:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Set up periodic session validation (every 5 minutes)
    const validationInterval = setInterval(async () => {
      if (session) {
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = session.expires_at || 0
        const timeUntilExpiry = expiresAt - now
        
        console.log('🔄 AuthContext: Session validation - expires in:', Math.floor(timeUntilExpiry / 60), 'minutes')
        
        // If session expires within 10 minutes, refresh it
        if (timeUntilExpiry < 10 * 60) {
          console.log('🔄 AuthContext: Session expiring soon, refreshing...')
          try {
            const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
            if (error) throw error
            
            if (refreshedSession) {
              console.log('✅ AuthContext: Session refreshed during validation')
              setSession(refreshedSession)
              setUser(refreshedSession.user)
            }
          } catch (error) {
            console.error('❌ AuthContext: Session refresh failed during validation:', error)
            // Don't clear session here, let the auth state change handler deal with it
          }
        }
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(validationInterval)
    }
  }, [session])

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