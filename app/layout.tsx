import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Wordle Golf Tracker',
  description: 'Family Wordle competition with golf scoring and tournaments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 