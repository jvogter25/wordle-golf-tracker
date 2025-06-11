import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏌️ Wordle Golf Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your family's daily Wordle into an exciting golf competition with tournaments and handicaps
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/auth/login" 
              className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/groups" 
              className="bg-white text-primary-500 border border-primary-500 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              View Groups
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">⛳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">USGA Golf Scoring</h3>
            <p className="text-gray-600">Convert Wordle attempts to authentic golf scores with eagles, birdies, and bogeys</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Major Tournaments</h3>
            <p className="text-gray-600">Four annual championships matching real golf majors with cuts and leaderboards</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎂</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Birthday Tournaments</h3>
            <p className="text-gray-600">Personal celebration tournaments with stroke advantages for birthday players</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Handicap System</h3>
            <p className="text-gray-600">Fair competition with automatic USGA-style handicap calculations</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Family Groups</h3>
            <p className="text-gray-600">Private family competitions with secure invite codes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Score Entry</h3>
            <p className="text-gray-600">Quick score submission with automatic Wordle result parsing</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 shadow-md mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Play Wordle</h3>
              <p className="text-gray-600 text-sm">Complete your daily Wordle puzzle</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit Score</h3>
              <p className="text-gray-600 text-sm">Enter your attempts (1-7)</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Golf Score</h3>
              <p className="text-gray-600 text-sm">Automatic conversion to golf terminology</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Compete</h3>
              <p className="text-gray-600 text-sm">Track rankings and tournament progress</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/groups" 
            className="bg-blue-500 text-white p-4 rounded-lg text-center font-semibold hover:bg-blue-600 transition-colors"
          >
            👥 Groups
          </Link>
          <Link 
            href="/submit" 
            className="bg-green-500 text-white p-4 rounded-lg text-center font-semibold hover:bg-green-600 transition-colors"
          >
            ➕ Submit Score
          </Link>
          <Link 
            href="/leaderboard" 
            className="bg-yellow-500 text-white p-4 rounded-lg text-center font-semibold hover:bg-yellow-600 transition-colors"
          >
            🏆 Leaderboard
          </Link>
          <Link 
            href="/tournaments" 
            className="bg-purple-500 text-white p-4 rounded-lg text-center font-semibold hover:bg-purple-600 transition-colors"
          >
            🎯 Tournaments
          </Link>
        </div>
      </div>
    </div>
  )
} 