import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutCardWithProgressProps {
  workout: any;
  isCoach?: boolean;
  progress: {
    completed: number;
    total: number;
    percentage: number;
    inProgressCount?: number;
    exerciseCount?: number;
  };
  checkWorkoutHasProgress: (workoutId: string) => Promise<boolean>;
  onStart: () => void;
  onRefresh?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
  currentUserId?: string;
  showRefresh?: boolean;
}

export function WorkoutCardWithProgress({
  workout,
  isCoach = false,
  progress,
  checkWorkoutHasProgress,
  onStart,
  onRefresh,
  onReset,
  onDelete,
  onViewDetails,
  currentUserId,
  showRefresh = true
}: WorkoutCardWithProgressProps) {
  const [hasProgress, setHasProgress] = useState<boolean>(false);
  const [isCheckingProgress, setIsCheckingProgress] = useState<boolean>(false);
  
  // Memoize the final progress decision to prevent excessive re-renders
  const finalHasProgress = useMemo(() => {
    return hasProgress || progress.completed > 0;
  }, [hasProgress, progress.completed]);

  // Check for granular progress on component mount only (not on every change)
  useEffect(() => {
    // Quick check: if we have completed exercises, we definitely have progress
    if (progress.completed > 0) {
      setHasProgress(true);
      return;
    }

    // Only check database progress once per workout ID, with debouncing
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      if (!isMounted || isCheckingProgress) return;
      
      setIsCheckingProgress(true);
      
      try {
        const granularProgress = await checkWorkoutHasProgress(workout.id);
        if (isMounted) {
          setHasProgress(granularProgress);
        }
      } catch (error) {
        console.error('Error checking workout progress:', error);
        if (isMounted) {
          setHasProgress(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingProgress(false);
        }
      }
    }, 300); // Debounce to prevent rapid-fire requests

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [workout.id]); // Remove progress.completed and checkWorkoutHasProgress from dependencies

  // Enhanced progress object with granular progress detection
  const enhancedProgress = useMemo(() => ({
    ...progress,
    hasProgress: finalHasProgress
  }), [progress, finalHasProgress]);

  return (
    <WorkoutCard
      workout={workout}
      isCoach={isCoach}
      progress={enhancedProgress}
      onStart={onStart}
      onRefresh={onRefresh}
      onReset={onReset}
      onDelete={onDelete}
      onViewDetails={onViewDetails}
      currentUserId={currentUserId}
      showRefresh={showRefresh}
    />
  );
} 