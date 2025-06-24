"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '../../../contexts/AuthContext';
import Navigation from '../../../components/Navigation';
import { getTodaysPuzzleNumber } from '../../../lib/wordle-utils';
import { submitUniversalScore } from '../../../lib/scores';

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

export default function GlobalSubmitScorePage() {
  const [score, setScore] = useState('');
  const [puzzleNumber, setPuzzleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [todaysPuzzleNumber, setTodaysPuzzleNumber] = useState<number | null>(null);
  
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const setupPuzzleNumber = () => {
      // Calculate today's puzzle number using PST timezone
      const calculatedPuzzleNumber = getTodaysPuzzleNumber();
      setTodaysPuzzleNumber(calculatedPuzzleNumber);
      setPuzzleNumber(calculatedPuzzleNumber.toString());
    };

    setupPuzzleNumber();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage('Please sign in');
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
      
      // Submit universally to all groups
      const results = await submitUniversalScore(supabase, rawScore, puzzleNum, today);
      
      if (results.success.length > 0) {
        const successMessage = results.success.length === 1 && results.success[0] === 'Individual Profile' 
          ? 'Score submitted to your individual profile!'
          : `Score submitted to ${results.success.length} group${results.success.length !== 1 ? 's' : ''}: ${results.success.join(', ')}`;
        
        const skippedMessage = results.skipped.length > 0 
          ? ` (Already submitted to: ${results.skipped.join(', ')})`
          : '';
          
        setMessage(successMessage + skippedMessage);
        setMessageType('success');
        
        // Redirect to homepage after a short delay
        setTimeout(() => {
          router.push('/golf/homepage');
        }, 3000);
      } else {
        setMessage('Failed to submit score to any groups');
        setMessageType('error');
      }
      
    } catch (error: any) {
      console.error('Error submitting universal score:', error);
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

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        <Navigation 
          context="global"
          centerLink={{
            href: "/golf/homepage",
            label: "Home"
          }}
        />

        <WordleHeader label="SUBMIT" />
        
        {/* Info Banner */}
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 mb-6 border border-[hsl(var(--border))]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Submit Today's Score</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Your score will be applied to all groups you're in</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Submit Form */}
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

            <button
              type="submit"
              disabled={isSubmitting || !score || !puzzleNumber}
              className="w-full bg-[#6aaa64] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#599a5b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 