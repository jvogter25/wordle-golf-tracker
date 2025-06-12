'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback started')
        console.log('🔍 Current URL:', window.location.href)
        
        // Get the current URL hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        console.log('🔍 Hash params:', Object.fromEntries(hashParams))
        console.log('🔍 Search params:', Object.fromEntries(searchParams))
        
        // Check for error in URL
        const error = hashParams.get('error') || searchParams.get('error')
        if (error) {
          console.error('❌ Auth error from URL:', error)
          setStatus('error')
          setMessage(`Authentication failed: ${error}`)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        // Check for access token in hash (magic link flow)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          console.log('✅ Found tokens in URL, setting session...')
          
          // Set the session using the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError)
            setStatus('error')
            setMessage('Failed to establish session')
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }

          if (data.session) {
            console.log('✅ Magic link authentication successful:', data.session.user.email)
            console.log('✅ Session established:', data.session.access_token.substring(0, 20) + '...')
            
            setStatus('success')
            setMessage('Successfully signed in! Redirecting...')
            
            // Wait a bit longer to ensure session is fully established
            console.log('⏳ Waiting for session to be fully established...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Verify session is still valid before redirecting
            const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
            if (verifyError || !verifyData.session) {
              console.error('❌ Session verification failed:', verifyError)
              setStatus('error')
              setMessage('Session verification failed')
              setTimeout(() => router.push('/auth/login'), 3000)
              return
            }
            
            console.log('✅ Session verified, redirecting to home page...')
            
            // Force a full page reload to ensure CSS and auth state are properly loaded
            window.location.href = '/'
            return
          }
        }

        // Fallback: try to get existing session
        console.log('🔍 No tokens in URL, checking for existing session...')
        const { data: sessionData, error: getSessionError } = await supabase.auth.getSession()
        
        if (getSessionError) {
          console.error('❌ Get session error:', getSessionError)
          setStatus('error')
          setMessage('Failed to verify session')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (sessionData.session) {
          console.log('✅ Existing session found:', sessionData.session.user.email)
          setStatus('success')
          setMessage('Already signed in! Redirecting...')
          
          // Force a full page reload to ensure CSS and auth state are properly loaded
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
          return
        }

        // No valid session found
        console.log('ℹ️ No valid session, redirecting to login')
        setStatus('error')
        setMessage('No valid authentication found')
        setTimeout(() => router.push('/auth/login'), 2000)
        
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    // Small delay to ensure URL is fully loaded
    const timer = setTimeout(handleAuthCallback, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="spinner mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  )
} 