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
        const error = searchParams.get('error') || hashParams.get('error')
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description')
        
        if (error) {
          console.error('❌ Magic Link Callback: Auth error from URL:', error, errorDescription)
          setStatus('error')
          setMessage(`Authentication failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        // For PKCE flow, Supabase handles the token exchange automatically
        // We just need to wait a moment and then check for the session
        console.log('⏳ Magic Link Callback: Waiting for Supabase to process PKCE token...')
        
        // Wait a bit for Supabase to process the authentication
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check for session multiple times with retries
        let session = null
        let attempts = 0
        const maxAttempts = 5
        
        while (!session && attempts < maxAttempts) {
          attempts++
          console.log(`🔍 Magic Link Callback: Checking for session (attempt ${attempts}/${maxAttempts})...`)
          
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Magic Link Callback: Session error:', sessionError)
          } else if (sessionData.session) {
            session = sessionData.session
            console.log('✅ Magic Link Callback: Session found:', session.user.email)
            break
          } else {
            console.log('⏳ Magic Link Callback: No session yet, waiting...')
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (session) {
          console.log('✅ Magic Link Callback: Authentication successful!')
          console.log('✅ Magic Link Callback: User:', session.user.email)
          console.log('✅ Magic Link Callback: Session expires at:', new Date(session.expires_at! * 1000).toLocaleString())
          
          setStatus('success')
          setMessage('Successfully signed in! Redirecting...')
          
          // Wait a moment to show success message
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          console.log('🏠 Magic Link Callback: Redirecting to home page...')
          
          // Force a full page reload to ensure CSS and auth state are properly loaded
          window.location.href = '/'
          return
        }

        // If we get here, authentication failed
        console.log('❌ Magic Link Callback: No session found after all attempts')
        setStatus('error')
        setMessage('Authentication failed - no session established')
        setTimeout(() => router.push('/auth/login'), 3000)
        
      } catch (error) {
        console.error('❌ Magic Link Callback: Unexpected error in auth callback:', error)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  )
} 