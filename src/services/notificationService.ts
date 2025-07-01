/**
 * Notification Service
 * Handles creating notifications for various events in the application
 */

import { supabase } from '../lib/supabase';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata?: any;
}

/**
 * Create a notification in the database
 */
export const createNotification = async (notificationData: NotificationData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        created_at: new Date().toISOString(),
        is_read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

/**
 * Create notification when a workout is assigned to an athlete
 */
export const createWorkoutAssignmentNotification = async (
  athleteId: string,
  workoutId: string,
  workoutName: string,
  coachId: string,
  coachName: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: athleteId,
      title: 'New Workout Assigned',
      message: `${coachName} assigned you a new workout: "${workoutName}"`,
      type: 'workout_assigned',
      metadata: {
        workout_id: workoutId,
        coach_id: coachId,
        sender_id: coachId,
        action: 'assigned'
      }
    });
  } catch (error) {
    console.error('Error creating workout assignment notification:', error);
  }
};

/**
 * Create notification when a workout assignment is updated
 */
export const createWorkoutUpdateNotification = async (
  athleteId: string,
  workoutId: string,
  workoutName: string,
  coachId: string,
  coachName: string,
  changeDescription: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: athleteId,
      title: 'Workout Updated',
      message: `${coachName} updated your workout "${workoutName}": ${changeDescription}`,
      type: 'workout_updated',
      metadata: {
        workout_id: workoutId,
        coach_id: coachId,
        sender_id: coachId,
        action: 'updated',
        change_description: changeDescription
      }
    });
  } catch (error) {
    console.error('Error creating workout update notification:', error);
  }
};

/**
 * Create notification when a meet event is assigned to an athlete
 */
export const createMeetAssignmentNotification = async (
  athleteId: string,
  meetEventId: string,
  eventName: string,
  meetName: string,
  coachId: string,
  coachName: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: athleteId,
      title: 'New Meet Event Assigned',
      message: `${coachName} assigned you to compete in "${eventName}" at ${meetName}`,
      type: 'meet_assigned',
      metadata: {
        meet_event_id: meetEventId,
        event_name: eventName,
        meet_name: meetName,
        coach_id: coachId,
        sender_id: coachId,
        action: 'assigned'
      }
    });
  } catch (error) {
    console.error('Error creating meet assignment notification:', error);
  }
};

/**
 * Create notification when a meet assignment is updated
 */
export const createMeetUpdateNotification = async (
  athleteId: string,
  meetEventId: string,
  eventName: string,
  meetName: string,
  coachId: string,
  coachName: string,
  changeDescription: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: athleteId,
      title: 'Meet Assignment Updated',
      message: `${coachName} updated your assignment for "${eventName}" at ${meetName}: ${changeDescription}`,
      type: 'meet_updated',
      metadata: {
        meet_event_id: meetEventId,
        event_name: eventName,
        meet_name: meetName,
        coach_id: coachId,
        sender_id: coachId,
        action: 'updated',
        change_description: changeDescription
      }
    });
  } catch (error) {
    console.error('Error creating meet update notification:', error);
  }
};

/**
 * Create notifications for multiple athletes when a workout is assigned
 */
export const createBulkWorkoutAssignmentNotifications = async (
  athleteIds: string[],
  workoutId: string,
  workoutName: string,
  coachId: string,
  coachName: string
): Promise<void> => {
  try {
    const notifications = athleteIds.map(athleteId => ({
      user_id: athleteId,
      title: 'New Workout Assigned',
      message: `${coachName} assigned you a new workout: "${workoutName}"`,
      type: 'workout_assigned',
      metadata: {
        workout_id: workoutId,
        coach_id: coachId,
        sender_id: coachId,
        action: 'assigned'
      },
      created_at: new Date().toISOString(),
      is_read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating bulk workout notifications:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create bulk workout notifications:', error);
  }
};

/**
 * Create notifications for multiple athletes when a meet event is assigned
 */
export const createBulkMeetAssignmentNotifications = async (
  athleteIds: string[],
  meetEventId: string,
  eventName: string,
  meetName: string,
  coachId: string,
  coachName: string
): Promise<void> => {
  try {
    const notifications = athleteIds.map(athleteId => ({
      user_id: athleteId,
      title: 'New Meet Event Assigned',
      message: `${coachName} assigned you to compete in "${eventName}" at ${meetName}`,
      type: 'meet_assigned',
      metadata: {
        meet_event_id: meetEventId,
        event_name: eventName,
        meet_name: meetName,
        coach_id: coachId,
        sender_id: coachId,
        action: 'assigned'
      },
      created_at: new Date().toISOString(),
      is_read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating bulk meet notifications:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create bulk meet notifications:', error);
  }
};

/**
 * Get coach name for notifications
 */
export const getCoachName = async (coachId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', coachId)
      .single();

    if (error || !data) {
      return 'Your Coach';
    }

    return `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Your Coach';
  } catch (error) {
    console.error('Error fetching coach name:', error);
    return 'Your Coach';
  }
};

/**
 * Get workout name for notifications
 */
export const getWorkoutName = async (workoutId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('name')
      .eq('id', workoutId)
      .single();

    if (error || !data) {
      return 'Workout';
    }

    return data.name || 'Workout';
  } catch (error) {
    console.error('Error fetching workout name:', error);
    return 'Workout';
  }
};

/**
 * Get meet event and meet names for notifications
 */
export const getMeetEventDetails = async (meetEventId: string): Promise<{ eventName: string; meetName: string }> => {
  try {
    const { data, error } = await supabase
      .from('meet_events')
      .select(`
        event_name,
        track_meets!inner(name)
      `)
      .eq('id', meetEventId)
      .single();

    if (error || !data) {
      return { eventName: 'Event', meetName: 'Meet' };
    }

    return {
      eventName: data.event_name || 'Event',
      meetName: (data.track_meets as any)?.name || 'Meet'
    };
  } catch (error) {
    console.error('Error fetching meet event details:', error);
    return { eventName: 'Event', meetName: 'Meet' };
  }
}; 