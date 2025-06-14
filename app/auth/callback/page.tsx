'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { supabase } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback')
          return
        }

        if (data.session) {
          // Successful authentication
          router.push('/groups')
        } else {
          // No session found
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth/login?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router])

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