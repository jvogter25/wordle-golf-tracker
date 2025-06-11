// Golf scoring conversion for Wordle attempts
export const convertAttemptsToGolf = (attempts: number): { score: string, rawScore: number } => {
  switch (attempts) {
    case 1:
      return { score: 'Hole in One!', rawScore: -3 }
    case 2:
      return { score: 'Eagle', rawScore: -2 }
    case 3:
      return { score: 'Birdie', rawScore: -1 }
    case 4:
      return { score: 'Par', rawScore: 0 }
    case 5:
      return { score: 'Bogey', rawScore: 1 }
    case 6:
      return { score: 'Double Bogey', rawScore: 2 }
    default:
      return { score: 'Triple Bogey', rawScore: 3 }
  }
}

export const getGolfScoreColor = (score: string): string => {
  switch (score) {
    case 'Hole in One!':
      return 'text-purple-600'
    case 'Eagle':
      return 'text-golf-eagle'
    case 'Birdie':
      return 'text-golf-birdie'
    case 'Par':
      return 'text-golf-par'
    case 'Bogey':
      return 'text-golf-bogey'
    case 'Double Bogey':
      return 'text-golf-double'
    case 'Triple Bogey':
      return 'text-golf-triple'
    default:
      return 'text-gray-600'
  }
}

// USGA-style handicap calculation
export const calculateHandicap = (scores: number[], gamesPlayed: number): number => {
  if (gamesPlayed < 3) return 0 // Minimum 3 games required
  
  // Sort scores (best to worst)
  const sortedScores = [...scores].sort((a, b) => a - b)
  
  // Determine how many scores to use based on USGA guidelines
  let scoresUsed: number
  if (gamesPlayed >= 20) {
    scoresUsed = 8 // Best 8 of 20
  } else if (gamesPlayed >= 15) {
    scoresUsed = 6 // Best 6 of 15-19
  } else if (gamesPlayed >= 10) {
    scoresUsed = 4 // Best 4 of 10-14
  } else if (gamesPlayed >= 6) {
    scoresUsed = 3 // Best 3 of 6-9
  } else {
    scoresUsed = 2 // Best 2 of 3-5
  }
  
  // Calculate average of best scores
  const bestScores = sortedScores.slice(0, scoresUsed)
  const average = bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length
  
  // Apply USGA multiplier (0.96) and round to one decimal
  const handicap = Math.round(average * 0.96 * 10) / 10
  
  return Math.max(0, handicap) // Handicap can't be negative
}

// Calculate handicap-adjusted score
export const calculateNetScore = (rawScore: number, handicap: number): number => {
  return Math.round((rawScore - handicap) * 10) / 10
}

// Parse Wordle result from clipboard
export const parseWordleResult = (clipboardText: string): { attempts: number, date: string } | null => {
  // Look for Wordle result pattern: "Wordle XXX Y/6"
  const wordlePattern = /Wordle\s+(\d+)\s+([1-6X])\/6/i
  const match = clipboardText.match(wordlePattern)
  
  if (!match) return null
  
  const puzzleNumber = parseInt(match[1])
  const attemptsStr = match[2]
  const attempts = attemptsStr === 'X' ? 7 : parseInt(attemptsStr) // X means failed (7 attempts)
  
  // Calculate date based on puzzle number (Wordle #1 was June 19, 2021)
  const startDate = new Date('2021-06-19')
  const puzzleDate = new Date(startDate)
  puzzleDate.setDate(startDate.getDate() + puzzleNumber - 1)
  
  return {
    attempts,
    date: puzzleDate.toISOString().split('T')[0] // YYYY-MM-DD format
  }
}

// Validate if submission is for current day (Pacific Time)
export const isCurrentDaySubmission = (puzzleDate: string): boolean => {
  const today = new Date()
  const pacificTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
  const todayStr = pacificTime.toISOString().split('T')[0]
  
  return puzzleDate === todayStr
} 