import React from 'react'

interface UserAvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg'
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
    lg: 'w-16 h-16 text-xl'
  }

  const name = displayName || email || 'User'
  const initials = name[0].toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold ${className}`}>
      {initials}
    </div>
  )
} 