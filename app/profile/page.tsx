'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('🔄 Profile page: Auth state changed', { user: user?.email, authLoading })
    
    if (!authLoading) {
      if (user) {
        console.log('✅ User found, fetching profile')
        fetchProfile()
      } else {
        console.log('ℹ️ No user, stopping loading')
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
      }
    } catch (error: any) {
      setMessage(`Error loading profile: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setMessage('Display name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          email: user?.email,
          display_name: displayName.trim(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setMessage('Profile updated successfully!')
      await fetchProfile()
    } catch (error: any) {
      setMessage(`Error updating profile: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setMessage('')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.')
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setMessage('Profile picture updated successfully!')
      await fetchProfile()
    } catch (error: any) {
      setMessage(`Error uploading image: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return

    try {
      setUploading(true)
      
      // Remove avatar URL from profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      setMessage('Profile picture removed successfully!')
      await fetchProfile()
    } catch (error: any) {
      setMessage(`Error removing image: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Profile Picture Section */}
          <div className="mb-8 text-center">
            <div className="mb-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-primary-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200">
                  {(displayName || profile?.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 mr-2"
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </button>
              
              {profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  disabled={uploading}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  Remove Picture
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Upload a profile picture (max 2MB). JPG, PNG, or GIF.
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={updateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will be displayed on leaderboards and in groups
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 