// Force rebuild for Vercel styling fix
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const getRedirectUrl = () => {
    // Always use the current origin, whether localhost or production
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/magic-link`
    }
    return '/auth/magic-link'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Please enter your email address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const redirectUrl = getRedirectUrl()
      console.log('Redirect URL:', redirectUrl) // For debugging
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Check your email for the login link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            🏌️ Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Wordle Golf account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input"
              disabled={loading}
              required
            />
          </div>

          {message && (
            <div className={`alert ${
              message.includes('Error') 
                ? 'alert-error' 
                : 'alert-success'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600">
              Sign up here
            </Link>
          </p>
          <Link href="/" className="text-blue-600">
            ← Back to Home
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2 text-gray-900">How it works:</h3>
          <ul className="text-gray-600 space-y-1">
            <li>• Enter your email address</li>
            <li>• We'll send you a secure login link</li>
            <li>• Click the link to sign in instantly</li>
            <li>• No passwords to remember!</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 