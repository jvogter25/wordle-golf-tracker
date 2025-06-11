'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export default function TournamentsPage() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <Link href="/auth/login" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournaments</h1>
          <p className="text-gray-600">Major and Birthday Tournaments</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournaments Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            Tournament features are being developed. This will include Major Tournaments matching real golf championships 
            and Birthday Tournaments for family celebrations.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Major Tournaments</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• The Masters (April)</li>
                <li>• PGA Championship (May)</li>
                <li>• U.S. Open (June)</li>
                <li>• Open Championship (July)</li>
              </ul>
            </div>
            
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Birthday Tournaments</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Personal celebration weeks</li>
                <li>• Birthday stroke advantages</li>
                <li>• Custom tournament names</li>
                <li>• Family milestone events</li>
              </ul>
            </div>
          </div>

          <Link
            href="/groups"
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    </div>
  )
} 