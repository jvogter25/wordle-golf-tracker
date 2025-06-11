'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Please enter your email address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Check your email for the login link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏌️ Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Wordle Golf account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign up here
            </Link>
          </p>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
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