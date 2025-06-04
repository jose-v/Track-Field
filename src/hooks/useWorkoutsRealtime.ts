import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

interface WorkoutRealtimeOptions {
  athleteId?: string;
  coachId?: string;
  workoutIds?: string[];
  enabled?: boolean;
}

interface AthleteWorkoutPayload {
  workout_id: string;
  athlete_id: string;
  status: string;
  completed_exercises?: number[];
  [key: string]: any;
}

interface WorkoutPayload {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Hook for setting up real-time subscriptions to workout updates
 * This can be used by both athletes and coaches to get real-time updates
 */
export function useWorkoutsRealtime({
  athleteId,
  coachId,
  workoutIds = [],
  enabled = true
}: WorkoutRealtimeOptions) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || (!athleteId && !coachId && !workoutIds.length)) {
      return;
    }

    let subscriptions: { unsubscribe: () => void }[] = [];

    const setupSubscriptions = async () => {
      if (!session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No active session, skipping real-time subscriptions');
        }
        return;
      }

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting up real-time workout subscriptions');
        }

        // 1. Subscribe to athlete_workouts table changes
        const athleteWorkoutsSubscription = supabase
          .channel('athlete-workouts-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'athlete_workouts',
              filter: workoutIds.length 
                ? `workout_id=in.(${workoutIds.join(',')})` 
                : athleteId 
                  ? `athlete_id=eq.${athleteId}` 
                  : undefined
            },
            (payload) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Real-time update received for athlete_workouts:', payload);
              }
              setLastUpdate(new Date());
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
              queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts'] });
              
              // For specific workout update - invalidate that workout
              if (payload.new && (payload.new as AthleteWorkoutPayload).workout_id) {
                queryClient.invalidateQueries({ 
                  queryKey: ['workout', (payload.new as AthleteWorkoutPayload).workout_id] 
                });
              }
            }
          )
          .subscribe();

        subscriptions.push(athleteWorkoutsSubscription);

        // 2. Subscribe to workouts table changes if we have specific workout IDs
        if (workoutIds.length > 0) {
          const workoutsSubscription = supabase
            .channel('workouts-changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'workouts',
                filter: `id=in.(${workoutIds.join(',')})`
              },
              (payload) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Real-time update received for workouts:', payload);
                }
                setLastUpdate(new Date());
                
                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ['workouts'] });
                if (payload.new) {
                  queryClient.invalidateQueries({ 
                    queryKey: ['workout', (payload.new as WorkoutPayload).id] 
                  });
                }
              }
            )
            .subscribe();

          subscriptions.push(workoutsSubscription);
        }

        setIsSubscribed(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('Real-time subscriptions established successfully');
        }
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
      }
    };

    setupSubscriptions();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleaning up real-time subscriptions');
      }
      subscriptions.forEach(subscription => subscription.unsubscribe());
      setIsSubscribed(false);
    };
  }, [session, athleteId, coachId, enabled, JSON.stringify(workoutIds), queryClient]);

  // Force refresh function
  const forceRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
    queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts'] });
    
    if (workoutIds.length > 0) {
      workoutIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['workout', id] });
      });
    }
    
    setLastUpdate(new Date());
  };

  return {
    isSubscribed,
    lastUpdate,
    forceRefresh
  };
} 