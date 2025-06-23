'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { supabase } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !displayName.trim()) {
      setMessage('Please fill in all fields')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Account created! You can now log in.')
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
            🏌️ Join the Fun
          </h1>
          <p className="text-gray-600">
            Create your Wordle Golf account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (visible to family members)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (default: 123456)"
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign in here
            </Link>
          </p>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-2">How it works:</h3>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Enter your email and display name</li>
            <li>• Click the verification link in your email</li>
            <li>• Set up your password for future logins</li>
            <li>• Start tracking your Wordle scores!</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 