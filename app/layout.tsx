import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { GroupProvider } from '../contexts/GroupContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Wordle Golf Tracker',
  description: 'Track your Wordle golf scores and compete with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <GroupProvider>
            {children}
            <Toaster />
          </GroupProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 