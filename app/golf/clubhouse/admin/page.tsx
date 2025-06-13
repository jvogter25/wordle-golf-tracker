"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function ClubhouseAdminPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchMembersAndScores = async () => {
      // Fetch group members
      const { data: membersData } = await supabase.from('users').select('*');
      setMembers(membersData || []);
      // Fetch scores
      const { data: scoresData } = await supabase.from('scores').select('*').order('puzzle_date', { ascending: false });
      setScores(scoresData || []);
    };
    fetchMembersAndScores();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Center</h1>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Member</h2>
          {/* Add member form can be implemented here if needed */}
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-lg font-semibold mb-4">Remove Member</h2>
          <ul>
            {members.map(m => (
              <li key={m.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>{m.display_name} <span className="text-xs text-[hsl(var(--muted-foreground))]">({m.email})</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold mb-4">Edit Scores</h2>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Player</th>
                <th className="py-2">Date</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(s => (
                <tr key={s.id}>
                  <td className="py-2">{members.find(m => m.id === s.user_id)?.display_name || s.user_id}</td>
                  <td className="py-2">{s.puzzle_date}</td>
                  <td className="py-2">{s.raw_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 