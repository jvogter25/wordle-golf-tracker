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
  const basePuzzleNumber = 1466;
  
  // Get current time in PST and extract just the date
  const now = new Date();
  const pstDateString = now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }); // Returns "MM/DD/YYYY" format
  
  // Parse PST date string to get clean date object
  const [month, day, year] = pstDateString.split('/');
  const pstDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Base date as clean date object
  const baseDate = new Date(2025, 5, 24); // June 24, 2025 (month is 0-indexed)
  
  // Calculate days difference
  const diffTime = pstDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return basePuzzleNumber + diffDays;
}

/**
 * Calculate puzzle number for a specific date in PST timezone
 * @param date - The date to calculate puzzle number for
 */
export function getPuzzleNumberForDate(date: Date): number {
  // Base date: June 24, 2025 = Puzzle #1466 (correct Wordle number)
  const basePuzzleNumber = 1466;
  
  // Convert input date to PST date string, then to clean date object
  const pstDateString = date.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [month, day, year] = pstDateString.split('/');
  const pstDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Base date as clean date object
  const baseDate = new Date(2025, 5, 24); // June 24, 2025 (month is 0-indexed)
  
  // Calculate days difference
  const diffTime = pstDate.getTime() - baseDate.getTime();
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
 * Get today's PST date in YYYY-MM-DD format for database storage
 */
export function getTodaysPSTDate(): string {
  const now = new Date();
  const pstDateString = now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [month, day, year] = pstDateString.split('/');
  return `${year}-${month}-${day}`;
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