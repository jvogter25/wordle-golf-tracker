"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import NavigationAvatar from './NavigationAvatar';

interface NavigationProps {
  context: 'global' | 'group';
  groupId?: string;
  centerLink?: {
    href: string;
    label: string;
  };
}

const globalMenuItems = [
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/homepage', label: 'Home Dashboard' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
];

const groupMenuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
];

function BurgerMenu({ context, groupId }: { context: 'global' | 'group'; groupId?: string }) {
  const [open, setOpen] = useState(false);
  
  const menuItems = context === 'global' ? globalMenuItems : groupMenuItems;
  
  return (
    <div className="relative">
      <button
        className="p-2 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-md"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation menu"
      >
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-48 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 flex flex-col">
          {menuItems.map(link => {
            const href = typeof link.href === 'function' 
              ? (groupId ? link.href(groupId) : link.href())
              : link.href;
              
            return (
              <Link
                key={link.label}
                href={href}
                className="px-4 py-3 border-b border-[hsl(var(--border))] last:border-b-0 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] font-semibold text-base transition"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navigation({ context, groupId, centerLink }: NavigationProps) {
  return (
    <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
      <NavigationAvatar size="md" linkTo="/golf/profile" />
      
      {centerLink && (
        <div className="flex-1 flex justify-center">
          <Link 
            href={centerLink.href} 
            className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition"
          >
            {centerLink.label}
          </Link>
        </div>
      )}
      
      <div className="flex items-center justify-end">
        <BurgerMenu context={context} groupId={groupId} />
      </div>
    </nav>
  );
}

// Context indicator component for debugging
export function NavigationContextIndicator({ context, groupId }: { context: 'global' | 'group'; groupId?: string }) {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded text-xs font-mono">
      Context: {context} {groupId && `(${groupId})`}
    </div>
  );
} 