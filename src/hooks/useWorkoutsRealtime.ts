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
              
              // Debounce invalidations to prevent excessive requests
              setTimeout(() => {
                // Only invalidate the most essential queries for athlete workouts
                const athleteId = (payload.new as AthleteWorkoutPayload)?.athlete_id || 
                                (payload.old as AthleteWorkoutPayload)?.athlete_id;
                
                if (athleteId) {
                  // Only invalidate athlete-specific queries, not global ones
                  queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts', athleteId] });
                }
              }, 500); // 500ms debounce
            }
          )
          .subscribe();

        subscriptions.push(athleteWorkoutsSubscription);

        // 2. Subscribe to training_plan_assignments table changes
        const trainingPlanAssignmentsSubscription = supabase
          .channel('training-plan-assignments-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'training_plan_assignments',
              filter: athleteId ? `athlete_id=eq.${athleteId}` : undefined
            },
            (payload) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Real-time update received for training_plan_assignments:', payload);
              }
              setLastUpdate(new Date());
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['monthlyPlans'] });
              queryClient.invalidateQueries({ queryKey: ['trainingPlanAssignments'] });
              
              // For assignment changes, invalidate the affected athlete's cache
              const athleteId = (payload.new as any)?.athlete_id || 
                              (payload.old as any)?.athlete_id;
              if (athleteId) {
                queryClient.invalidateQueries({ queryKey: ['athleteMonthlyPlanAssignments', athleteId] });
              }
              
              // For specific training plan update - invalidate that plan
              const planId = (payload.new as any)?.training_plan_id || 
                            (payload.old as any)?.training_plan_id;
              if (planId) {
                queryClient.invalidateQueries({ 
                  queryKey: ['trainingPlan', planId] 
                });
              }
            }
          )
          .subscribe();

        subscriptions.push(trainingPlanAssignmentsSubscription);

        // 3. Subscribe to workouts table changes if we have specific workout IDs
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
    queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyPlans'] });
    queryClient.invalidateQueries({ queryKey: ['trainingPlanAssignments'] });
    
    // If we're tracking a specific athlete, invalidate their cache
    if (athleteId) {
      queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athleteMonthlyPlanAssignments', athleteId] });
    }
    
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