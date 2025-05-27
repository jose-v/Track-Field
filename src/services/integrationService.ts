/**
 * Integration Service
 * Handles integrations with other services and systems when events occur in the app
 */

import { supabase } from '../lib/supabase';
import { useGamification } from '../contexts/GamificationContext';

/**
 * Handle workout completion event
 * This will be called when an athlete completes a workout
 * It can trigger multiple integrations like gamification, notifications, etc.
 */
export const handleWorkoutCompletion = async (
  userId?: string,
  workoutId?: string,
  workoutData?: any
): Promise<void> => {
  if (!userId || !workoutId) {
    console.error('Missing required data for workout completion');
    return;
  }
  
  try {
    // Log the completion
    console.log(`User ${userId} completed workout ${workoutId}`);
    
    // 1. Add points in gamification system
    await addGamificationPoints(userId, 'workout_complete', 50);
    
    // 2. Record analytics
    await recordWorkoutAnalytics(userId, workoutId, workoutData);
    
    // 3. Send notification to coach (if applicable)
    await notifyCoach(userId, workoutId, workoutData?.name || 'Workout');
    
  } catch (error) {
    console.error('Error in workout completion integration:', error);
  }
};

/**
 * Handle nutrition log event
 * This will be called when an athlete logs nutrition information
 */
export const handleNutritionLog = async (
  userId: string
): Promise<void> => {
  if (!userId) {
    console.error('Missing user ID for nutrition log');
    return;
  }
  
  try {
    console.log(`User ${userId} logged nutrition data`);
    
    // Add points in gamification system
    await addGamificationPoints(userId, 'nutrition_log', 20);
    
    // Record achievement if this is first nutrition log
    await checkNutritionMilestones(userId);
    
  } catch (error) {
    console.error('Error in nutrition log integration:', error);
  }
};

/**
 * Handle sleep log event
 * This will be called when an athlete logs sleep information
 */
export const handleSleepLog = async (
  userId: string
): Promise<void> => {
  if (!userId) {
    console.error('Missing user ID for sleep log');
    return;
  }
  
  try {
    console.log(`User ${userId} logged sleep data`);
    
    // Add points in gamification system
    await addGamificationPoints(userId, 'sleep_log', 15);
    
    // Record achievement if this is first sleep log
    await checkSleepMilestones(userId);
    
  } catch (error) {
    console.error('Error in sleep log integration:', error);
  }
};

/**
 * Check sleep-related milestones and achievements
 */
const checkSleepMilestones = async (userId: string): Promise<void> => {
  try {
    // Get count of sleep logs
    const { count, error } = await supabase
      .from('sleep_records')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', userId);
    
    if (error) {
      throw error;
    }
    
    // First time logging sleep
    if (count === 1) {
      // Record achievement
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: 'sleep_first_log',
          unlocked_at: new Date().toISOString()
        });
    }
    
    // Consistent sleep tracking (7 days)
    if (count === 7) {
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: 'sleep_week_streak',
          unlocked_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error checking sleep milestones:', error);
  }
};

/**
 * Check nutrition-related milestones and achievements
 */
const checkNutritionMilestones = async (userId: string): Promise<void> => {
  try {
    // Get count of nutrition logs
    const { count, error } = await supabase
      .from('eating_records')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', userId);
    
    if (error) {
      throw error;
    }
    
    // First time logging nutrition
    if (count === 1) {
      // Record achievement
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: 'nutrition_first_log',
          unlocked_at: new Date().toISOString()
        });
    }
    
    // Consistent nutrition tracking (7 days)
    if (count === 7) {
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: 'nutrition_week_streak',
          unlocked_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error checking nutrition milestones:', error);
  }
};

/**
 * Add points to user's gamification profile
 */
const addGamificationPoints = async (
  userId: string,
  action: string,
  points: number
): Promise<void> => {
  try {
    // Insert into points_history table
    const { error } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        action,
        points,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error adding gamification points:', error);
    }
  } catch (error) {
    console.error('Failed to add gamification points:', error);
  }
};

/**
 * Record workout analytics
 */
const recordWorkoutAnalytics = async (
  userId: string,
  workoutId: string,
  workoutData: any
): Promise<void> => {
  try {
    // Record completion time, workout type, etc.
    const { error } = await supabase
      .from('workout_analytics')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        workout_type: workoutData?.type || 'general',
        completion_time: new Date().toISOString(),
        duration: workoutData?.duration || '0'
      });
    
    if (error) {
      console.error('Error recording workout analytics:', error);
    }
  } catch (error) {
    console.error('Failed to record workout analytics:', error);
  }
};

/**
 * Notify coach about workout completion
 */
const notifyCoach = async (
  athleteId: string,
  workoutId: string,
  workoutName: string
): Promise<void> => {
  try {
    // First, find the coach for this athlete
    const { data: athleteData, error: athleteError } = await supabase
      .from('athlete_profiles')
      .select('coach_id')
      .eq('user_id', athleteId)
      .single();
    
    if (athleteError || !athleteData?.coach_id) {
      console.log('No coach found for athlete or error:', athleteError);
      return;
    }
    
    const coachId = athleteData.coach_id;
    
    // Then create a notification for the coach
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: coachId,
        title: 'Workout Completed',
        message: `Your athlete has completed the workout: ${workoutName}`,
        type: 'workout_complete',
        related_id: workoutId,
        is_read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating coach notification:', error);
    }
  } catch (error) {
    console.error('Failed to notify coach:', error);
  }
};

export default {
  handleWorkoutCompletion,
  handleNutritionLog,
  handleSleepLog
}; 