'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function MagicLinkCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Magic Link Callback: Auth callback started')
        console.log('🔍 Magic Link Callback: Current URL:', window.location.href)
        
        // Get URL parameters
        const searchParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        console.log('🔍 Magic Link Callback: Search params:', Object.fromEntries(searchParams))
        console.log('🔍 Magic Link Callback: Hash params:', Object.fromEntries(hashParams))
        
        // Check for error in URL
        const error = hashParams.get('error') || searchParams.get('error')
        if (error) {
          console.error('❌ Magic Link Callback: Error in URL:', error)
          setStatus('error')
          setMessage(`Authentication error: ${error}`)
          return
        }

        // For PKCE flow, Supabase handles the token exchange automatically
        // We just need to wait for the session to be established
        console.log('🔄 Magic Link Callback: Waiting for PKCE session establishment...')
        
        let session = null
        let attempts = 0
        const maxAttempts = 15 // Increased from 10 to 15
        
        // Poll for session with exponential backoff
        while (!session && attempts < maxAttempts) {
          attempts++
          const delay = Math.min(1000 * Math.pow(1.5, attempts - 1), 3000) // Max 3 second delay
          
          console.log(`🔄 Magic Link Callback: Attempt ${attempts}/${maxAttempts}, waiting ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Magic Link Callback: Session error:', sessionError)
            continue
          }
          
          if (currentSession) {
            session = currentSession
            console.log('✅ Magic Link Callback: Session found!', {
              user: session.user?.email,
              expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
            })
            break
          }
          
          console.log(`⏳ Magic Link Callback: No session yet, attempt ${attempts}/${maxAttempts}`)
        }

        if (!session) {
          console.error('❌ Magic Link Callback: Failed to establish session after all attempts')
          setStatus('error')
          setMessage('Failed to establish authentication session. Please try again.')
          return
        }

        // Verify session is valid and user exists
        if (!session.user) {
          console.error('❌ Magic Link Callback: Session exists but no user')
          setStatus('error')
          setMessage('Authentication session is invalid. Please try again.')
          return
        }

        console.log('✅ Magic Link Callback: Successfully authenticated!', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
        })

        // Force a session refresh to ensure it's properly stored
        console.log('🔄 Magic Link Callback: Refreshing session to ensure persistence...')
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.warn('⚠️ Magic Link Callback: Session refresh failed:', refreshError)
        } else if (refreshedSession.session) {
          console.log('✅ Magic Link Callback: Session refreshed successfully')
        }

        // Trigger auth state change event manually to ensure AuthContext picks it up
        console.log('🔄 Magic Link Callback: Triggering auth state change...')
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Magic Link Callback: Auth state change triggered:', event, session?.user?.email)
        })

        setStatus('success')
        setMessage('Successfully authenticated! Redirecting...')

        // Wait a bit longer before redirect to ensure AuthContext has time to update
        console.log('🔄 Magic Link Callback: Waiting 4 seconds before redirect to ensure AuthContext updates...')
        await new Promise(resolve => setTimeout(resolve, 4000))

        console.log('🔄 Magic Link Callback: Redirecting to home page...')
        
        // Use window.location.href for a full page reload to ensure fresh state
        window.location.href = '/'

      } catch (error) {
        console.error('❌ Magic Link Callback: Unexpected error:', error)
        setStatus('error')
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
              <p className="text-gray-600">Please wait while we authenticate your account.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 