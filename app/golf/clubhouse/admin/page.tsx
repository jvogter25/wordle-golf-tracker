"use client";
import { useState } from 'react';

// Mock group data
const mockMembers = [
  { id: '1', name: 'Jake Vogter', email: 'jake@example.com' },
  { id: '2', name: 'Annika Sörenstam', email: 'annika@example.com' },
  { id: '3', name: 'Rory McIlroy', email: 'rory@example.com' },
];
const mockScores = [
  { id: '1', name: 'Jake Vogter', date: '06/10/24', score: 3 },
  { id: '2', name: 'Annika Sörenstam', date: '06/10/24', score: 4 },
  { id: '3', name: 'Rory McIlroy', date: '06/10/24', score: 2 },
];

export default function ClubhouseAdminPage() {
  const [members, setMembers] = useState(mockMembers);
  const [scores, setScores] = useState(mockScores);
  const [newEmail, setNewEmail] = useState("");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Center</h1>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Member</h2>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (newEmail) setMembers([...members, { id: Date.now().toString(), name: newEmail.split('@')[0], email: newEmail }]); setNewEmail(""); }}>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" className="flex-1 p-2 border rounded-md" required />
            <button type="submit" className="bg-[#6aaa64] text-white px-4 py-2 rounded-md font-bold">Add</button>
          </form>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))] mb-8">
          <h2 className="text-lg font-semibold mb-4">Remove Member</h2>
          <ul>
            {members.map(m => (
              <li key={m.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>{m.name} <span className="text-xs text-[hsl(var(--muted-foreground))]">({m.email})</span></span>
                <button className="text-red-600 font-bold" onClick={() => setMembers(members.filter(mem => mem.id !== m.id))}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-sm p-6 border border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold mb-4">Edit Scores</h2>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Date</th>
                <th className="py-2">Score</th>
                <th className="py-2">Edit</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(s => (
                <tr key={s.id}>
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.date}</td>
                  <td className="py-2">{s.score}</td>
                  <td className="py-2"><button className="text-blue-600 font-bold">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 