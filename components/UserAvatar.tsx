import React from 'react'

interface UserAvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function UserAvatar({ 
  avatarUrl, 
  displayName, 
  email, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || email || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  // Default to 👤 emoji when no avatar
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center ${className}`}>
      <span role="img" aria-label="avatar">👤</span>
    </div>
  )
} 