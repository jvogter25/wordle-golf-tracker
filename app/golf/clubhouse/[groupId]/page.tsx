"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { getGroupMembers } from '../../../../lib/groups';

export default function ClubhouseGroupPage({ params }) {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  console.log('DEBUG: Current user from useAuth:', user);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editMemberId, setEditMemberId] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editDate, setEditDate] = useState('');
  const [message, setMessage] = useState('');
  const isAdmin = user?.email === 'jakevogt25@gmail.com' || user?.email === 'jake.vogt@softchoice.com';

  useEffect(() => {
    if (!authLoading && params?.groupId) {
      getGroupMembers(supabase, params.groupId).then((members) => {
        setMembers(members);
      }).finally(() => setLoading(false));
    }
  }, [authLoading, params?.groupId]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in</div>;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Adding member with email: ${newMemberEmail}`);
    setNewMemberEmail('');
  };

  const handleEditScore = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Editing score for member ${editMemberId} on ${editDate} to ${editScore}`);
    setEditMemberId('');
    setEditScore('');
    setEditDate('');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <button onClick={() => router.back()} className="text-[hsl(var(--primary))] font-bold">← Back</button>
        </nav>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8 text-center">Group Members</h2>
          <div className="grid grid-cols-3 gap-6 justify-items-center">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col items-center">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name}
                    className="w-20 h-20 rounded-full border-2 border-green-700 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center rounded-full border-2 border-green-700 bg-gray-100 text-4xl">
                    <span role="img" aria-label="avatar">👤</span>
                  </div>
                )}
                <div className="mt-2 text-center font-semibold">{member.display_name}</div>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">HCP {member.handicap}</span>
              </div>
            ))}
          </div>
        </div>
        {isAdmin && (
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-8 border border-[hsl(var(--border))]">
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
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.display_name}</option>
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