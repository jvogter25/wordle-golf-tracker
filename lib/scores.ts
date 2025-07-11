import { convertAttemptsToGolf, calculateHandicap, isCurrentDaySubmission } from './golf-scoring'

export const submitScore = async (supabase, groupId: string, attempts: number, puzzleDate: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Validate current day submission
  if (!isCurrentDaySubmission(puzzleDate)) {
    throw new Error('Can only submit scores for the current day')
  }
  
  // Check if score already exists for this date
  const { data: existingScore } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('group_id', groupId)
    .eq('puzzle_date', puzzleDate)
    .single()
  
  if (existingScore) {
    throw new Error('Score already submitted for this date')
  }
  
  const { score, rawScore } = convertAttemptsToGolf(attempts)
  
  // Submit score
  const { data: newScore, error: scoreError } = await supabase
    .from('scores')
    .insert({
      user_id: user.data.user.id,
      group_id: groupId,
      puzzle_date: puzzleDate,
      attempts,
      golf_score: score,
      raw_score: rawScore
    })
    .select()
    .single()
  
  if (scoreError) throw scoreError
  
  // Update handicap
  await updateHandicap(supabase, user.data.user.id, groupId)
  
  return newScore
}

export const submitUniversalScore = async (supabase, attempts: number, puzzleNumber: number, puzzleDate: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Validate current day submission
  if (!isCurrentDaySubmission(puzzleDate)) {
    throw new Error('Can only submit scores for the current day')
  }

  // Get all groups the user is a member of
  const { data: userGroups, error: groupsError } = await supabase
    .from('group_members')
    .select('group_id, groups(name)')
    .eq('user_id', user.data.user.id)

  if (groupsError) throw groupsError

  const results = {
    success: [],
    failed: [],
    skipped: []
  }

  // If user is not in any groups, submit as individual score
  if (!userGroups || userGroups.length === 0) {
    // Check if individual score already exists
    const { data: existingIndividualScore } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.data.user.id)
      .is('group_id', null)
      .eq('puzzle_number', puzzleNumber)
      .single()

    if (existingIndividualScore) {
      throw new Error('You have already submitted a score for this puzzle')
    }

    // Submit individual score
    const { error: individualError } = await supabase
      .from('scores')
      .insert({
        user_id: user.data.user.id,
        group_id: null, // Individual score
        puzzle_date: puzzleDate,
        puzzle_number: puzzleNumber,
        attempts: attempts,
        golf_score: attempts === 1 ? 'Hole-in-One' : attempts === 2 ? 'Eagle' : attempts === 3 ? 'Birdie' : attempts === 4 ? 'Par' : attempts === 5 ? 'Bogey' : attempts === 6 ? 'Double Bogey' : 'Failed',
        raw_score: attempts,
        submitted_by_admin: false
      })

    if (individualError) throw individualError

    results.success.push('Individual Profile')
    return results
  }

  // Submit to all groups the user is a member of
  for (const userGroup of userGroups) {
    const groupId = userGroup.group_id
    const groupName = userGroup.groups?.name || 'Unknown Group'

    try {
      // Check if score already exists for this group and puzzle number
      const { data: existingScore } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('group_id', groupId)
        .eq('puzzle_number', puzzleNumber)
        .single()

      if (existingScore) {
        results.skipped.push(groupName)
        continue
      }

      // Submit score to this group
      const { error: scoreError } = await supabase
        .from('scores')
        .insert({
          user_id: user.data.user.id,
          group_id: groupId,
          puzzle_date: puzzleDate,
          puzzle_number: puzzleNumber,
          attempts: attempts,
          golf_score: attempts === 1 ? 'Hole-in-One' : attempts === 2 ? 'Eagle' : attempts === 3 ? 'Birdie' : attempts === 4 ? 'Par' : attempts === 5 ? 'Bogey' : attempts === 6 ? 'Double Bogey' : 'Failed',
          raw_score: attempts,
          submitted_by_admin: false
        })

      if (scoreError) {
        results.failed.push(groupName)
        console.error(`Failed to submit to ${groupName}:`, scoreError)
      } else {
        results.success.push(groupName)
      }
    } catch (error) {
      results.failed.push(groupName)
      console.error(`Error submitting to ${groupName}:`, error)
    }
  }

  return results
}

export const updateHandicap = async (supabase, userId: string, groupId: string) => {
  // Get recent scores for handicap calculation
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('raw_score')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .order('puzzle_date', { ascending: false })
    .limit(20)
  
  if (scoresError) throw scoresError
  
  const rawScores = scores.map(s => s.raw_score)
  const gamesPlayed = rawScores.length
  const handicap = calculateHandicap(rawScores, gamesPlayed)
  
  // Upsert handicap
  const { error: handicapError } = await supabase
    .from('handicaps')
    .upsert({
      user_id: userId,
      group_id: groupId,
      current_handicap: handicap,
      games_played: gamesPlayed,
      last_updated: new Date().toISOString()
    })
  
  if (handicapError) throw handicapError
  
  return handicap
}

export const getMonthlyLeaderboard = async (supabase, groupId: string, year: number, month: number) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month
  
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      ),
      handicaps (
        current_handicap
      )
    `)
    .eq('group_id', groupId)
    .gte('puzzle_date', startDate)
    .lte('puzzle_date', endDate)
    .order('puzzle_date', { ascending: false })
  
  if (error) throw error
  
  // Group by user and calculate totals
  const userStats = new Map()
  
  data.forEach(score => {
    const userId = score.user_id
    if (!userStats.has(userId)) {
      userStats.set(userId, {
        user: score.profiles,
        handicap: score.handicaps?.current_handicap || 0,
        totalRawScore: 0,
        totalNetScore: 0,
        gamesPlayed: 0,
        scores: []
      })
    }
    
    const stats = userStats.get(userId)
    const netScore = score.raw_score - (stats.handicap || 0)
    
    stats.totalRawScore += score.raw_score
    stats.totalNetScore += netScore
    stats.gamesPlayed += 1
    stats.scores.push({
      date: score.puzzle_date,
      attempts: score.attempts,
      golfScore: score.golf_score,
      rawScore: score.raw_score,
      netScore
    })
  })
  
  // Convert to array and sort by net score average
  const leaderboard = Array.from(userStats.values())
    .filter(stats => stats.gamesPlayed > 0)
    .map(stats => ({
      ...stats,
      avgRawScore: Math.round((stats.totalRawScore / stats.gamesPlayed) * 100) / 100,
      avgNetScore: Math.round((stats.totalNetScore / stats.gamesPlayed) * 100) / 100
    }))
    .sort((a, b) => a.avgNetScore - b.avgNetScore)
  
  return leaderboard
}

export const getUserMonthlyStats = async (supabase, userId: string, groupId: string, year: number, month: number) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .gte('puzzle_date', startDate)
    .lte('puzzle_date', endDate)
    .order('puzzle_date', { ascending: true })
  
  if (error) throw error
  
  const { data: handicap } = await supabase
    .from('handicaps')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .single()
  
  return {
    scores,
    handicap: handicap?.current_handicap || 0,
    gamesPlayed: scores.length,
    avgScore: scores.length > 0 ? 
      Math.round((scores.reduce((sum, s) => sum + s.raw_score, 0) / scores.length) * 100) / 100 : 0
  }
} 