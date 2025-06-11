// Force rebuild for Vercel styling fix
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-4">
            🏌️ Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Wordle Golf account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-bold mb-4">
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
            />
          </div>

          {message && (
            <div className={`p-4 rounded ${
              message.includes('Error') 
                ? 'bg-red-50 border' 
                : 'bg-green-50 border'
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

        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-4">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600">
              Sign up here
            </Link>
          </p>
          <Link href="/" className="text-gray-600">
            ← Back to Home
          </Link>
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-4">How it works:</h3>
          <ul className="text-gray-600">
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