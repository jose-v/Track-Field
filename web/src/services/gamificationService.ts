/**
 * Gamification Service
 * Provides functions for managing points, badges, streaks, and leaderboards
 */

// This import may show a linter error during development, but will work when deployed
// @ts-ignore
import { supabase } from '../lib/supabase';
import { BADGE_DEFINITIONS } from '../config/badges';
import { LEVELS, calculateLevel } from '../config/levels';
import type { 
  PointsLedgerEntry, 
  Badge, 
  AthleteBadge, 
  AthleteStreak,
  LeaderboardEntry 
} from '../types/gamification';

// Mock Supabase client for development 
// NOTE: This is commented out as we're using the actual Supabase client
/*
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data, error: null })
      })
    }),
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ error: null })
      }),
      upsert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data, error: null })
        })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null })
    })
  }),
  rpc: (func: string, params: any) => Promise.resolve({ data: [], error: null })
};
*/

/**
 * Award points to an athlete
 */
export async function awardPoints(
  athleteId: string, 
  points: number, 
  reason: string
): Promise<PointsLedgerEntry | null> {
  try {
    const { data, error } = await supabase
      .from('points_ledger')
      .insert({
        athlete_id: athleteId,
        points,
        reason
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // After awarding points, check for milestone badges
    await checkPointMilestones(athleteId);
    
    return data;
  } catch (error) {
    console.error('Error awarding points:', error);
    return null;
  }
}

/**
 * Get total points for an athlete
 */
export async function getAthletePoints(athleteId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('points')
      .eq('athlete_id', athleteId);
    
    if (error) throw error;
    
    // Sum up all points entries with proper typing
    return data.reduce((total: number, entry: { points: number }) => total + entry.points, 0);
  } catch (error) {
    console.error('Error getting athlete points:', error);
    return 0;
  }
}

/**
 * Get level information for an athlete based on total points
 */
export async function getAthleteLevel(athleteId: string) {
  const totalPoints = await getAthletePoints(athleteId);
  return calculateLevel(totalPoints);
}

/**
 * Populate badge definitions in the database
 * This should be run once during setup
 */
export async function populateBadgeDefinitions(): Promise<void> {
  try {
    for (const badge of BADGE_DEFINITIONS) {
      // Check if badge already exists
      const { data: existingBadge } = await supabase
        .from('badges')
        .select('id')
        .eq('code', badge.code)
        .single();
      
      if (existingBadge) {
        // Update existing badge
        await supabase
          .from('badges')
          .update(badge)
          .eq('code', badge.code);
      } else {
        // Insert new badge
        await supabase
          .from('badges')
          .insert(badge);
      }
    }
    
    console.log('Badge definitions populated successfully');
  } catch (error) {
    console.error('Error populating badge definitions:', error);
    throw error;
  }
}

/**
 * Award a badge to an athlete
 */
export async function awardBadge(athleteId: string, badgeCode: string): Promise<AthleteBadge | null> {
  try {
    // First get the badge ID
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('code', badgeCode)
      .single();
    
    if (badgeError || !badge) {
      console.error('Badge not found:', badgeCode);
      return null;
    }
    
    // Check if athlete already has this badge
    const { data: existingBadge } = await supabase
      .from('athlete_badges')
      .select()
      .eq('athlete_id', athleteId)
      .eq('badge_id', badge.id)
      .single();
    
    if (existingBadge) {
      console.log('Athlete already has this badge:', badgeCode);
      return existingBadge;
    }
    
    // Award the badge
    const { data, error } = await supabase
      .from('athlete_badges')
      .insert({
        athlete_id: athleteId,
        badge_id: badge.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Give bonus points for earning a badge
    await awardPoints(athleteId, 10, `Earned ${badgeCode} badge`);
    
    return data;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
}

/**
 * Check if athlete qualifies for any point milestone badges
 */
async function checkPointMilestones(athleteId: string): Promise<void> {
  const totalPoints = await getAthletePoints(athleteId);
  
  // Define point thresholds and corresponding badges
  const milestones = [
    { points: 100, badge: 'bronze_athlete' },
    { points: 250, badge: 'silver_athlete' },
    { points: 500, badge: 'gold_athlete' },
    { points: 1000, badge: 'platinum_athlete' }
  ];
  
  // Award badges for any milestones reached
  for (const milestone of milestones) {
    if (totalPoints >= milestone.points) {
      await awardBadge(athleteId, milestone.badge);
    }
  }
}

/**
 * Get all badges for an athlete
 */
export async function getAthleteBadges(athleteId: string): Promise<AthleteBadge[]> {
  try {
    const { data, error } = await supabase
      .from('athlete_badges')
      .select(`
        athlete_id,
        badge_id,
        awarded_at,
        badge:badges (*)
      `)
      .eq('athlete_id', athleteId);
    
    if (error) throw error;
    
    // Transform the data to match AthleteBadge type
    const formattedBadges: AthleteBadge[] = (data || []).map((item: any) => ({
      athlete_id: item.athlete_id,
      badge_id: item.badge_id,
      awarded_at: item.awarded_at,
      badge: item.badge
    }));
    
    return formattedBadges;
  } catch (error) {
    console.error('Error getting athlete badges:', error);
    return [];
  }
}

/**
 * Update an athlete's activity streak
 * Call this daily when an athlete logs any activity
 */
export async function updateActivityStreak(athleteId: string): Promise<AthleteStreak | null> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get current streak info
    const { data: currentStreak, error } = await supabase
      .from('athlete_streaks')
      .select('*')
      .eq('athlete_id', athleteId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" error
      throw error;
    }
    
    let streak: AthleteStreak;
    
    if (!currentStreak) {
      // First activity ever - create new streak record
      streak = {
        athlete_id: athleteId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      };
    } else {
      const lastActivityDate = new Date(currentStreak.last_activity_date || '');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Convert to YYYY-MM-DD format for comparison
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (currentStreak.last_activity_date === today) {
        // Already logged activity today - no streak change
        return currentStreak;
      } else if (currentStreak.last_activity_date === yesterdayStr) {
        // Consecutive day - increase streak
        streak = {
          ...currentStreak,
          current_streak: currentStreak.current_streak + 1,
          longest_streak: Math.max(currentStreak.longest_streak, currentStreak.current_streak + 1),
          last_activity_date: today,
          updated_at: new Date().toISOString()
        };
      } else {
        // Streak broken - reset to 1
        streak = {
          ...currentStreak,
          current_streak: 1,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        };
      }
    }
    
    // Update streak in database
    const { data, error: updateError } = await supabase
      .from('athlete_streaks')
      .upsert(streak)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Check for streak badges
    await checkStreakMilestones(athleteId, streak.current_streak);
    
    return data;
  } catch (error) {
    console.error('Error updating activity streak:', error);
    return null;
  }
}

/**
 * Check if athlete qualifies for any streak milestone badges
 */
async function checkStreakMilestones(athleteId: string, currentStreak: number): Promise<void> {
  // Define streak thresholds and corresponding badges
  const milestones = [
    { days: 3, badge: 'getting_started' },
    { days: 7, badge: 'consistency' },
    { days: 14, badge: 'dedication' },
    { days: 30, badge: 'unstoppable' }
  ];
  
  // Award badges for any milestones reached
  for (const milestone of milestones) {
    if (currentStreak >= milestone.days) {
      await awardBadge(athleteId, milestone.badge);
    }
  }
  
  // Award bonus points for weekly streaks
  if (currentStreak % 7 === 0) {
    await awardPoints(athleteId, 50, `${currentStreak}-day streak bonus`);
  }
}

/**
 * Get leaderboard based on total points
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // This is a complex query, so we use a custom RPC function for efficiency
    const { data, error } = await supabase.rpc('get_points_leaderboard', { limit_count: limit });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get leaderboard filtered by team
 */
export async function getTeamLeaderboard(teamName: string, limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // First get profiles that belong to this team
    const { data: teamProfiles, error: teamError } = await supabase
      .from('profiles')
      .select('id')
      .eq('team', teamName);
    
    if (teamError) throw teamError;
    
    if (!teamProfiles || teamProfiles.length === 0) {
      console.log(`No members found for team: ${teamName}`);
      return [];
    }
    
    // Extract the athlete IDs from the profiles
    const teamAthleteIds = teamProfiles.map(profile => profile.id);
    
    // Get the full leaderboard
    const { data, error } = await supabase.rpc('get_points_leaderboard', { limit_count: 100 }); // Get a larger set to filter from
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Filter by team members and limit results
    const teamLeaderboard = data
      .filter((entry: LeaderboardEntry) => teamAthleteIds.includes(entry.athlete_id))
      .slice(0, limit);
    
    return teamLeaderboard;
  } catch (error) {
    console.error('Error getting team leaderboard:', error);
    return [];
  }
}

/**
 * Reset all gamification data for an athlete (for testing purposes)
 */
export async function resetAthleteGamification(athleteId: string): Promise<boolean> {
  try {
    const { error: pointsError } = await supabase
      .from('points_ledger')
      .delete()
      .eq('athlete_id', athleteId);
    
    if (pointsError) throw pointsError;
    
    const { error: badgesError } = await supabase
      .from('athlete_badges')
      .delete()
      .eq('athlete_id', athleteId);
    
    if (badgesError) throw badgesError;
    
    const { error: streakError } = await supabase
      .from('athlete_streaks')
      .delete()
      .eq('athlete_id', athleteId);
    
    if (streakError) throw streakError;
    
    return true;
  } catch (error) {
    console.error('Error resetting athlete gamification:', error);
    return false;
  }
} 