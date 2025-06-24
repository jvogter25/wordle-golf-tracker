"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const menuItems = [
  { href: '/golf/profile', label: 'Player Card' },
  { href: '/golf/homepage', label: 'Home Dashboard' },
  { href: '/golf/clubhouse', label: 'Clubhouse' },
];

function BurgerMenu() {
  const [open, setOpen] = useState(false);
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
          {menuItems.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 border-b border-[hsl(var(--border))] last:border-b-0 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] font-semibold text-base transition"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function WordleHeader({ label }: { label: string }) {
  const colors = ['bg-[#6aaa64]', 'bg-[#c9b458]', 'bg-[#787c7e]'];
  return (
    <div className="flex justify-center gap-1 mb-8">
      {label.split('').map((letter, idx) => (
        <span
          key={idx}
          className={`${colors[idx % colors.length]} w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-md font-bold text-white text-2xl md:text-3xl shadow-[0_2px_4px_rgba(0,0,0,0.12)] select-none`}
          style={{ fontFamily: 'Montserrat, Poppins, Arial, sans-serif', letterSpacing: '0.05em' }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

// Mock data for group members
const groupMembers = [
  { id: '1', name: 'Jake', email: 'jake@example.com', avatar: '/golf/jake-avatar.jpg' },
  { id: '2', name: 'Annika', email: 'annika@example.com', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '3', name: 'Rory', email: 'rory@example.com', avatar: 'https://randomuser.me/api/portraits/men/65.jpg' },
  { id: '4', name: 'Lexi', email: 'lexi@example.com', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

export default function GroupDetailPage() {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editMemberId, setEditMemberId] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase integration to add member
    alert(`Adding member with email: ${newMemberEmail}`);
    setNewMemberEmail('');
  };

  const handleEditScore = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Supabase integration to edit score
    alert(`Editing score for member ${editMemberId} on ${editDate} to ${editScore}`);
    setEditMemberId('');
    setEditScore('');
    setEditDate('');
  };

  const isAdmin = true; // Hardcoded for now

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <Link href="/golf/player" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary))] bg-gray-100 flex items-center justify-center">
                <span role="img" aria-label="avatar">👤</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[hsl(var(--primary))] rounded-full border-2 border-[hsl(var(--card))]" />
            </div>
          </Link>
          <div className="flex-1 flex justify-center">
            <Link href="/golf/homepage" className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">Home</Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu />
          </div>
        </nav>
        <WordleHeader label="GROUP DETAIL" />
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))]">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8 text-center">Group Members</h2>
          <div className="grid gap-4">
            {groupMembers.map(member => (
              <div key={member.id} className="flex items-center space-x-4 p-4 bg-[hsl(var(--muted))] rounded-lg">
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))]">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8 text-center">Admin Center</h2>
            <form onSubmit={handleAddMember} className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Add Member</h3>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email"
                  className="flex-1 p-2 border border-[hsl(var(--border))] rounded"
                  required
                />
                <button type="submit" className="bg-[#6aaa64] text-white px-4 py-2 rounded">Add</button>
              </div>
            </form>
            <form onSubmit={handleEditScore}>
              <h3 className="text-lg font-semibold mb-4">Edit Score</h3>
              <div className="grid gap-4">
                <select
                  value={editMemberId}
                  onChange={(e) => setEditMemberId(e.target.value)}
                  className="p-2 border border-[hsl(var(--border))] rounded"
                  required
                >
                  <option value="">Select Member</option>
                  {groupMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="p-2 border border-[hsl(var(--border))] rounded"
                  required
                />
                <input
                  type="number"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                  placeholder="Enter score"
                  className="p-2 border border-[hsl(var(--border))] rounded"
                  required
                />
                <button type="submit" className="bg-[#6aaa64] text-white px-4 py-2 rounded">Update Score</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 