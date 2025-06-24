/**
 * Wordle Puzzle Number Utilities
 * 
 * Calculates puzzle numbers based on PST timezone.
 * Updates daily at 12:00 AM PST.
 */

/**
 * Get today's Wordle puzzle number in PST timezone
 * Hard-coded to start at 1466 on June 24, 2025 and increment daily at midnight PST
 */
export function getTodaysPuzzleNumber(): number {
  // Base date: June 24, 2025 = Puzzle #1466 (correct Wordle number)
  const baseDate = new Date('2025-06-24T00:00:00-08:00'); // PST
  const basePuzzleNumber = 1466;
  
  // Get current PST time
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Calculate days since base date (using PST)
  const basePSTDate = new Date(baseDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const diffTime = pstDate.getTime() - basePSTDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return basePuzzleNumber + diffDays;
}

/**
 * Calculate puzzle number for a specific date in PST timezone
 * @param date - The date to calculate puzzle number for
 */
export function getPuzzleNumberForDate(date: Date): number {
  // Base date: June 24, 2025 = Puzzle #1466 (correct Wordle number)
  const baseDate = new Date('2025-06-24T00:00:00-08:00'); // PST
  const basePuzzleNumber = 1466;
  
  // Convert input date to PST
  const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Calculate days since base date (using PST)
  const basePSTDate = new Date(baseDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const diffTime = pstDate.getTime() - basePSTDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return basePuzzleNumber + diffDays;
}

/**
 * Get formatted date string for PST timezone
 */
export function getTodaysPSTDateString(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Get formatted date string for leaderboard display
 * Returns format like "June 24, 2025"
 */
export function getTodaysFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
} 