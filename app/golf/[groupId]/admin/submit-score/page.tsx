'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useGroup } from '../../../../../contexts/GroupContext';
import Navigation from '../../../../../components/Navigation';
import { getTodaysPuzzleNumber } from '../../../../../lib/wordle-utils';

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

export default function AdminSubmitScorePage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [score, setScore] = useState('');
  const [puzzleNumber, setPuzzleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [todaysPuzzleNumber, setTodaysPuzzleNumber] = useState<number | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { selectedGroup, availableGroups, setSelectedGroup } = useGroup();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Set the selected group based on URL parameter
  useEffect(() => {
    if (groupId && availableGroups.length > 0 && (!selectedGroup || selectedGroup.id !== groupId)) {
      const targetGroup = availableGroups.find(g => g.id === groupId);
      if (targetGroup) {
        setSelectedGroup(targetGroup);
      }
    }
  }, [groupId, selectedGroup, availableGroups, setSelectedGroup]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!selectedGroup) return;

      try {
        const { data: members, error } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles (
              id,
              display_name,
              email
            )
          `)
          .eq('group_id', selectedGroup.id);

        if (error) throw error;
        setGroupMembers(members || []);
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

      const setupPuzzleNumber = () => {
    // Calculate today's puzzle number using PST timezone
    const calculatedPuzzleNumber = getTodaysPuzzleNumber();
    
    setTodaysPuzzleNumber(calculatedPuzzleNumber);
    setPuzzleNumber(calculatedPuzzleNumber.toString());
  };

    fetchGroupMembers();
    setupPuzzleNumber();
  }, [selectedGroup, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedGroup) {
      setMessage('Please sign in and select a group');
      setMessageType('error');
      return;
    }

    if (!selectedUser || !score || !puzzleNumber) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    const rawScore = parseInt(score);
    const puzzleNum = parseInt(puzzleNumber);

    if (rawScore < 1 || rawScore > 7) {
      setMessage('Score must be between 1 and 7 (7 for failed attempts)');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has already submitted for this puzzle number
      const { data: existingSubmission, error: checkError } = await supabase
        .from('scores')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('group_id', selectedGroup.id)
        .eq('puzzle_number', puzzleNum)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubmission) {
        // Update existing score (admin override)
        const { error } = await supabase
          .from('scores')
          .update({
            raw_score: rawScore,
            attempts: rawScore,
            golf_score: rawScore === 1 ? 'Hole-in-One' : rawScore === 2 ? 'Eagle' : rawScore === 3 ? 'Birdie' : rawScore === 4 ? 'Par' : rawScore === 5 ? 'Bogey' : rawScore === 6 ? 'Double Bogey' : 'Failed',
            submitted_by_admin: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);

        if (error) throw error;
        setMessage('Score updated successfully (admin override)!');
      } else {
        // Insert new score
        const { error } = await supabase
          .from('scores')
          .insert({
            user_id: selectedUser,
            group_id: selectedGroup.id,
            raw_score: rawScore,
            puzzle_number: puzzleNum,
            puzzle_date: today,
            attempts: rawScore,
            golf_score: rawScore === 1 ? 'Hole-in-One' : rawScore === 2 ? 'Eagle' : rawScore === 3 ? 'Birdie' : rawScore === 4 ? 'Par' : rawScore === 5 ? 'Bogey' : rawScore === 6 ? 'Double Bogey' : 'Failed',
            submitted_by_admin: true
          });

        if (error) throw error;
        setMessage('Score submitted successfully!');
      }
      
      setMessageType('success');
      
      // Reset form
      setSelectedUser('');
      setScore('');
      
    } catch (error: any) {
      console.error('Error submitting score:', error);
      setMessage(error.message || 'Failed to submit score');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreDisplay = (score: number) => {
    const scoreMap: { [key: number]: { emoji: string; name: string } } = {
      1: { emoji: '⛳️', name: 'Hole-in-One' },
      2: { emoji: '🦅', name: 'Eagle' },
      3: { emoji: '🐦‍⬛', name: 'Birdie' },
      4: { emoji: '🏌️', name: 'Par' },
      5: { emoji: '😬', name: 'Bogey' },
      6: { emoji: '😱', name: 'Double Bogey' },
      7: { emoji: '❌', name: 'Failed/Triple+' },
    };
    
    return scoreMap[score] || { emoji: '❓', name: 'Unknown' };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Please sign in</h2>
          <Link href="/auth/login" className="bg-[#6aaa64] text-white px-6 py-3 rounded-lg hover:bg-[#599a5b] transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6aaa64] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--muted-foreground))]">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <Navigation 
          context="group" 
          groupId={groupId}
          centerLink={{
            href: `/golf/${groupId}/dashboard`,
            label: "Dashboard"
          }}
        />

        <WordleHeader label="ADMIN SUBMIT" />
        
        {/* Group Info */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{selectedGroup.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Admin Score Submission</p>
            </div>
            <Link 
              href={`/golf/${groupId}/admin/tournaments`}
              className="text-[#6aaa64] hover:text-[#599a5b] font-semibold text-sm"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Admin Submit Form */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-6 shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
              Submit Score for User
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              As an admin, you can submit scores for any user and override existing scores.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="selectedUser" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Select User
              </label>
              <select
                id="selectedUser"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                required
              >
                <option value="">Select a user...</option>
                {groupMembers.map((member: any) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.profiles?.display_name || member.profiles?.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="puzzleNumber" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Puzzle Number
              </label>
              <input
                type="number"
                id="puzzleNumber"
                value={puzzleNumber}
                onChange={(e) => setPuzzleNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                placeholder="e.g., 924"
                required
                min="1"
              />
              {todaysPuzzleNumber && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Today's puzzle is #{todaysPuzzleNumber}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="score" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Score (Number of Attempts)
              </label>
              <select
                id="score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                required
              >
                <option value="">Select score</option>
                <option value="1">1 - ⛳️ Hole-in-One (Amazing!)</option>
                <option value="2">2 - 🦅 Eagle (Excellent!)</option>
                <option value="3">3 - 🐦‍⬛ Birdie (Great!)</option>
                <option value="4">4 - 🏌️ Par (Good!)</option>
                <option value="5">5 - 😬 Bogey (Not bad)</option>
                <option value="6">6 - 😱 Double Bogey (Tough one)</option>
                <option value="7">7 - ❌ Failed (Better luck tomorrow)</option>
              </select>
            </div>

            {/* Score Preview */}
            {score && (
              <div className="bg-[hsl(var(--muted))] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getScoreDisplay(parseInt(score)).emoji}</span>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">
                      {getScoreDisplay(parseInt(score)).name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Golf score: {parseInt(score)} {parseInt(score) === 1 ? 'stroke' : 'strokes'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedUser || !score || !puzzleNumber}
              className="w-full bg-[#6aaa64] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#599a5b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score (Admin Override)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 