'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError(error.message)
          setTimeout(() => router.push('/auth/login?error=callback'), 3000)
          return
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user.email)
          // Successful authentication - redirect to groups
          router.push('/groups')
        } else {
          // Try to exchange the code from URL params
          const code = searchParams.get('code')
          if (code) {
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
              console.error('Code exchange error:', exchangeError)
              setError(exchangeError.message)
              setTimeout(() => router.push('/auth/login?error=exchange'), 3000)
              return
            }

            if (sessionData.session) {
              console.log('Code exchange successful:', sessionData.session.user.email)
              router.push('/groups')
              return
            }
          }
          
          // No session and no code - redirect to login
          console.log('No session found, redirecting to login')
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        setError('An unexpected error occurred')
        setTimeout(() => router.push('/auth/login?error=unexpected'), 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  )
} 