"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGroup } from '../../../../contexts/GroupContext';
import { useAuth } from '../../../../contexts/AuthContext';
import NavigationAvatar from '../../../../components/NavigationAvatar';

const menuItems = [
  { href: (groupId: string) => `/golf/${groupId}/dashboard`, label: 'Dashboard' },
  { href: (groupId: string) => `/golf/${groupId}/leaderboard`, label: 'Leaderboard' },
  { href: (groupId: string) => `/golf/${groupId}/tournaments`, label: 'Tournaments' },
  { href: (groupId: string) => `/golf/${groupId}/submit`, label: 'Submit Score' },
  { href: () => '/golf/profile', label: 'Player Card' },
  { href: () => '/golf/clubhouse', label: 'Clubhouse' },
  { href: () => '/golf/admin', label: 'Admin Center' },
];

function BurgerMenu({ groupId }: { groupId: string }) {
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
              key={link.label}
              href={link.href(groupId)}
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

export default function GroupSubmitScorePage() {
  const [score, setScore] = useState('');
  const [puzzleNumber, setPuzzleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [todaysPuzzleNumber, setTodaysPuzzleNumber] = useState<number | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [existingScore, setExistingScore] = useState<number | null>(null);
  
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
    const fetchTodaysInfo = async () => {
      if (!user || !selectedGroup) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Calculate today's puzzle number (Wordle started on June 19, 2021 as puzzle #1)
      const wordleStart = new Date('2021-06-19');
      const todayDate = new Date();
      const diffTime = todayDate.getTime() - wordleStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedPuzzleNumber = diffDays;
      
      setTodaysPuzzleNumber(calculatedPuzzleNumber);
      setPuzzleNumber(calculatedPuzzleNumber.toString());

      // Check if user has already submitted for today's puzzle number in this group
      const { data: existingSubmission, error } = await supabase
        .from('scores')
        .select('raw_score')
        .eq('user_id', user.id)
        .eq('group_id', selectedGroup.id)
        .eq('puzzle_number', calculatedPuzzleNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing submission:', error);
      } else if (existingSubmission) {
        setHasSubmittedToday(true);
        setExistingScore(existingSubmission.raw_score);
        setScore(existingSubmission.raw_score.toString());
      }
    };

    fetchTodaysInfo();
  }, [user, selectedGroup, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedGroup) {
      setMessage('Please sign in and select a group');
      setMessageType('error');
      return;
    }

    if (!score || !puzzleNumber) {
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
        .select('id, raw_score, submitted_by_admin')
        .eq('user_id', user.id)
        .eq('group_id', selectedGroup.id)
        .eq('puzzle_number', puzzleNum)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubmission) {
        // User has already submitted for this puzzle number
        setMessage(`You have already submitted a score for puzzle #${puzzleNum}. Only one score per puzzle is allowed.`);
        setMessageType('error');
        setIsSubmitting(false);
        return;
      }

      // Insert new score
      const { error } = await supabase
        .from('scores')
        .insert({
          user_id: user.id,
          group_id: selectedGroup.id,
          raw_score: rawScore,
          puzzle_number: puzzleNum,
          puzzle_date: today,
          attempts: rawScore,
          golf_score: rawScore === 1 ? 'Hole-in-One' : rawScore === 2 ? 'Eagle' : rawScore === 3 ? 'Birdie' : rawScore === 4 ? 'Par' : rawScore === 5 ? 'Bogey' : rawScore === 6 ? 'Double Bogey' : 'Failed',
          submitted_by_admin: false
        });

      if (error) {
        throw error;
      }
      
      setMessage('Score submitted successfully!');
      setMessageType('success');
      setHasSubmittedToday(true);
      setExistingScore(rawScore);
      
      // Redirect to leaderboard after a short delay
      setTimeout(() => {
        router.push(`/golf/${groupId}/leaderboard`);
      }, 2000);
      
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
        <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))] mb-4">
          <NavigationAvatar size="md" linkTo="/golf/profile" />
          <div className="flex-1 flex justify-center">
            <Link href={`/golf/${groupId}/dashboard`} className="bg-[#6aaa64] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#599a5b] transition">Dashboard</Link>
          </div>
          <div className="flex items-center justify-end">
            <BurgerMenu groupId={groupId} />
          </div>
        </nav>

        <WordleHeader label="SUBMIT" />
        
        {/* Group Info */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{selectedGroup.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Submit Score for Group</p>
            </div>
            <Link 
              href="/golf/clubhouse" 
              className="text-[#6aaa64] hover:text-[#599a5b] font-semibold text-sm"
            >
              Switch Groups
            </Link>
          </div>
        </div>

        {/* Existing Score Alert */}
        {hasSubmittedToday && existingScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getScoreDisplay(existingScore).emoji}</span>
              <div>
                <h3 className="font-semibold text-blue-900">Already Submitted Today</h3>
                <p className="text-blue-700 text-sm">
                  Current score: {existingScore} ({getScoreDisplay(existingScore).name})
                </p>
              </div>
            </div>
            <p className="text-blue-600 text-sm">You can update your score below if needed.</p>
          </div>
        )}

        <div className="bg-[hsl(var(--card))] rounded-lg p-6 shadow-md border border-[hsl(var(--border))]">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                Your Score (Number of Attempts)
              </label>
              <select
                id="score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6aaa64] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                required
              >
                <option value="">Select your score</option>
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

            {message && (
              <div className={`p-4 rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6aaa64] text-white py-3 px-4 rounded-lg hover:bg-[#599a5b] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              {isSubmitting ? 'Submitting...' : hasSubmittedToday ? 'Update Score' : 'Submit Score'}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
            <h3 className="font-semibold text-[hsl(var(--foreground))] mb-3">How It Works</h3>
            <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <p>• Enter the number of attempts it took you to solve today's Wordle</p>
              <p>• Scores are converted to golf terminology (1 = Hole-in-One, 4 = Par, etc.)</p>
              <p>• Failed attempts count as 7 strokes</p>
              <p>• You can update your score if you made a mistake</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 