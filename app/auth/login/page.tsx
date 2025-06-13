// Force rebuild for Vercel styling fix
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setMessage('Please enter your email and password')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        router.push('/golf/homepage')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
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

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input"
              disabled={loading}
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
            {loading ? 'Signing in...' : 'Sign In'}
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
            <li>• Sign up or log in with your email and password (default password is <b>123456</b>).</li>
            <li>• Your email uniquely identifies you and saves your user settings, groups, and progress.</li>
            <li>• No magic links—just use your email and password to access your account.</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 