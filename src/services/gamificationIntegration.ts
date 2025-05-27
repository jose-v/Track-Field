/**
 * Gamification Integration Service
 * Connects gamification with app features and handles notifications
 */

import { 
  awardPoints, 
  updateActivityStreak,
  awardBadge,
  getAthleteBadges,
  getAthletePoints
} from './gamificationService';
import { calculateLevel } from '../config/levels';
import type { Badge } from '../types/gamification';

// Store notifications callbacks
let notificationCallbacks: {
  onBadge?: (badge: Badge) => void;
  onPoints?: (points: number, reason: string) => void;
  onLevelUp?: (level: number, title: string) => void;
  onStreak?: (days: number) => void;
} = {};

/**
 * Register notification callbacks
 */
export function registerNotificationHandlers(callbacks: {
  onBadge?: (badge: Badge) => void;
  onPoints?: (points: number, reason: string) => void;
  onLevelUp?: (level: number, title: string) => void;
  onStreak?: (days: number) => void;
}) {
  notificationCallbacks = { ...notificationCallbacks, ...callbacks };
}

/**
 * Get badge by code from athlete's badges
 */
async function getBadgeByCode(athleteId: string, badgeCode: string): Promise<Badge | null> {
  const badges = await getAthleteBadges(athleteId);
  const badgeEntry = badges.find(b => b.badge?.code === badgeCode);
  return badgeEntry?.badge || null;
}

/**
 * Handle workout completion
 */
export async function handleWorkoutCompletion(athleteId: string): Promise<void> {
  try {
    // Award points
    const pointsToAward = 20;
    const reason = 'Completed a workout';
    const pointsEntry = await awardPoints(athleteId, pointsToAward, reason);
    
    // Trigger points notification
    if (pointsEntry && notificationCallbacks.onPoints) {
      notificationCallbacks.onPoints(pointsToAward, reason);
    }
    
    // Update streak
    const streak = await updateActivityStreak(athleteId);
    
    // Trigger streak notification if it's a milestone
    if (streak && [3, 7, 14, 30].includes(streak.current_streak) && notificationCallbacks.onStreak) {
      notificationCallbacks.onStreak(streak.current_streak);
    }
    
    // Award first workout badge if not earned yet
    const firstWorkoutBadge = await awardBadge(athleteId, 'first_workout');
    
    // Trigger badge notification
    if (firstWorkoutBadge) {
      const badge = await getBadgeByCode(athleteId, 'first_workout');
      if (badge && notificationCallbacks.onBadge) {
        notificationCallbacks.onBadge(badge);
      }
    }
    
    // Check if level up occurred
    const totalPoints = await getAthletePoints(athleteId);
    const levelInfo = calculateLevel(totalPoints);
    
    // For level up notification, we need to know if we just crossed a threshold
    // We do this by checking if total points minus the points we just awarded would be a lower level
    const previousPoints = totalPoints - pointsToAward;
    const previousLevelInfo = calculateLevel(previousPoints);
    
    if (levelInfo.level > previousLevelInfo.level && notificationCallbacks.onLevelUp) {
      notificationCallbacks.onLevelUp(levelInfo.level, levelInfo.title);
    }
  } catch (error) {
    console.error('Error in handleWorkoutCompletion:', error);
  }
}

/**
 * Handle nutrition log
 */
export async function handleNutritionLog(athleteId: string): Promise<void> {
  try {
    // Award points
    const pointsToAward = 10;
    const reason = 'Logged nutrition data';
    const pointsEntry = await awardPoints(athleteId, pointsToAward, reason);
    
    // Trigger points notification
    if (pointsEntry && notificationCallbacks.onPoints) {
      notificationCallbacks.onPoints(pointsToAward, reason);
    }
    
    // Update streak
    const streak = await updateActivityStreak(athleteId);
    
    // Award nutrition badge if not earned yet
    const nutritionBadge = await awardBadge(athleteId, 'nutrition_novice');
    
    // Trigger badge notification
    if (nutritionBadge) {
      const badge = await getBadgeByCode(athleteId, 'nutrition_novice');
      if (badge && notificationCallbacks.onBadge) {
        notificationCallbacks.onBadge(badge);
      }
    }
    
    // Check for level up (same logic as in handleWorkoutCompletion)
    const totalPoints = await getAthletePoints(athleteId);
    const levelInfo = calculateLevel(totalPoints);
    
    const previousPoints = totalPoints - pointsToAward;
    const previousLevelInfo = calculateLevel(previousPoints);
    
    if (levelInfo.level > previousLevelInfo.level && notificationCallbacks.onLevelUp) {
      notificationCallbacks.onLevelUp(levelInfo.level, levelInfo.title);
    }
  } catch (error) {
    console.error('Error in handleNutritionLog:', error);
  }
}

/**
 * Handle sleep log
 */
export async function handleSleepLog(athleteId: string): Promise<void> {
  try {
    // Award points
    const pointsToAward = 10;
    const reason = 'Logged sleep data';
    const pointsEntry = await awardPoints(athleteId, pointsToAward, reason);
    
    // Trigger points notification
    if (pointsEntry && notificationCallbacks.onPoints) {
      notificationCallbacks.onPoints(pointsToAward, reason);
    }
    
    // Update streak
    const streak = await updateActivityStreak(athleteId);
    
    // Award sleep badge if not earned yet
    const sleepBadge = await awardBadge(athleteId, 'sleep_tracker');
    
    // Trigger badge notification
    if (sleepBadge) {
      const badge = await getBadgeByCode(athleteId, 'sleep_tracker');
      if (badge && notificationCallbacks.onBadge) {
        notificationCallbacks.onBadge(badge);
      }
    }
    
    // Check for level up (same logic as in other handlers)
    const totalPoints = await getAthletePoints(athleteId);
    const levelInfo = calculateLevel(totalPoints);
    
    const previousPoints = totalPoints - pointsToAward;
    const previousLevelInfo = calculateLevel(previousPoints);
    
    if (levelInfo.level > previousLevelInfo.level && notificationCallbacks.onLevelUp) {
      notificationCallbacks.onLevelUp(levelInfo.level, levelInfo.title);
    }
  } catch (error) {
    console.error('Error in handleSleepLog:', error);
  }
} 