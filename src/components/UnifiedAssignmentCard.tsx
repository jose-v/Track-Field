import React from 'react';
import { Clock, Calendar, Target, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { WorkoutAssignment } from '../services/assignmentService';
import { useUnifiedAssignmentActions } from '../hooks/useUnifiedAssignments';

interface UnifiedAssignmentCardProps {
  assignment: WorkoutAssignment;
  onExecute?: (assignmentId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function UnifiedAssignmentCard({ 
  assignment, 
  onExecute, 
  showActions = true,
  compact = false 
}: UnifiedAssignmentCardProps) {
  const { updateProgress, resetProgress } = useUnifiedAssignmentActions();

  // Extract assignment details based on type
  const getAssignmentDetails = () => {
    const { assignment_type, exercise_block, progress, meta } = assignment;
    
    switch (assignment_type) {
      case 'single':
        return {
          title: exercise_block.workout_name || 'Single Workout',
          subtitle: exercise_block.workout_type || 'Workout',
          duration: exercise_block.estimated_duration,
          exercises: exercise_block.exercises?.length || 0,
          icon: <Target className="w-5 h-5" />,
          color: 'bg-blue-500',
        };
        
      case 'weekly':
        return {
          title: exercise_block.workout_name || exercise_block.plan_name || 'Weekly Plan',
          subtitle: `Week ${meta?.current_week || 1}`,
          duration: `${exercise_block.total_days || 7} days`,
          exercises: Object.keys(exercise_block.daily_workouts || {}).length,
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-green-500',
        };
        
      case 'monthly':
        return {
          title: exercise_block.plan_name || 'Monthly Plan',
          subtitle: exercise_block.description || 'Training Plan',
          duration: `${exercise_block.duration_weeks || 4} weeks`,
          exercises: exercise_block.weekly_structure?.filter((week: any) => !week.is_rest_week)?.length || 0,
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-purple-500',
        };
        
      default:
        return {
          title: 'Unknown Assignment',
          subtitle: '',
          duration: '',
          exercises: 0,
          icon: <Target className="w-5 h-5" />,
          color: 'bg-gray-500',
        };
    }
  };

  const details = getAssignmentDetails();
  const progress_pct = assignment.progress?.completion_percentage || 0;
  const isCompleted = assignment.status === 'completed';
  const isInProgress = assignment.status === 'in_progress';
  const isAssigned = assignment.status === 'assigned';

  // Calculate detailed progress breakdown
  const getDetailedProgress = () => {
    // Get exercises based on assignment type
    let exercises: any[] = [];
    
    switch (assignment.assignment_type) {
      case 'monthly':
        // For monthly plans, we need to calculate based on the current week
        // For now, we'll use the stored progress data since fetching the actual exercises requires async calls
        // This will be updated with the actual exercises when the user opens the execution modal
        const totalWeeks = assignment.exercise_block?.weekly_structure?.filter((week: any) => !week.is_rest_week)?.length || 0;
        const currentWeek = Math.floor((assignment.progress?.current_exercise_index || 0) / Math.max(1, totalWeeks));
        
        // For monthly plans, treat each week as an "exercise" for display purposes
        // This is a simplified view since actual exercises would require fetching the weekly workouts
        return {
          blocks: { current: currentWeek, total: totalWeeks },
          exercises: { current: assignment.progress?.current_exercise_index || 0, total: assignment.progress?.total_exercises || totalWeeks },
          sets: { current: assignment.progress?.current_set || 0, total: assignment.progress?.current_set || 1 },
          reps: { current: assignment.progress?.current_rep || 0, total: assignment.progress?.current_rep || 1 }
        };
      
      case 'single':
        exercises = assignment.exercise_block?.exercises || [];
        break;
        
      case 'weekly':
        // For weekly plans, extract exercises from daily_workouts
        const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[today.getDay()];
        
        // Get today's workout first
        let todaysWorkout = dailyWorkouts[currentDayName];
        
        // If no workout for today, try to find the first available day
        if (!todaysWorkout) {
          const firstAvailableDay = Object.keys(dailyWorkouts).find(dayKey => {
            const dayWorkout = dailyWorkouts[dayKey];
            return dayWorkout && (Array.isArray(dayWorkout) ? dayWorkout.length > 0 : dayWorkout.exercises?.length > 0);
          });
          
          if (firstAvailableDay) {
            todaysWorkout = dailyWorkouts[firstAvailableDay];
          }
        }
        
        if (todaysWorkout) {
          if (Array.isArray(todaysWorkout)) {
            // New blocks format: array of blocks, each with exercises
            exercises = todaysWorkout.flatMap((block: any) => {
              const blockExercises = block.exercises || [];
              // Copy block-level metadata to individual exercises if they don't have it
              return blockExercises.map((exercise: any) => ({
                ...exercise,
                // Use exercise-level values first, then fall back to block-level, then defaults
                sets: exercise.sets || exercise.Sets || block.sets || block.Sets || 1,
                reps: exercise.reps || exercise.Reps || block.reps || block.Reps || 1,
                rest: exercise.rest || exercise.Rest || block.rest || block.Rest || 0
              }));
            });
          } else if (todaysWorkout.exercises && !todaysWorkout.is_rest_day) {
            // Old format: { exercises: [], is_rest_day: boolean }
            exercises = todaysWorkout.exercises.map((exercise: any) => ({
              ...exercise,
              // Ensure sets/reps are properly defined
              sets: exercise.sets || exercise.Sets || 1,
              reps: exercise.reps || exercise.Reps || 1,
              rest: exercise.rest || exercise.Rest || 0
            }));
          }
        }
        break;
        
      default:
        exercises = [];
    }
    
    const currentExerciseIndex = assignment.progress?.current_exercise_index || 0;
    const currentSet = assignment.progress?.current_set || 1;
    const currentRep = assignment.progress?.current_rep || 1;
    
    // Helper function to safely parse positive integers
    const parsePositiveInt = (value: any, fallback: number = 1): number => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) || parsed < 1 ? fallback : parsed;
    };

    // Calculate total sets and reps across all exercises
    let totalSets = 0;
    let totalReps = 0;
    let completedSets = 0;
    let completedReps = 0;

    exercises.forEach((exercise, index) => {
      // Improved extraction: try multiple possible fields and sources
      let exerciseSets = 1;
      let exerciseReps = 1;
      
      // Try to get sets from various possible sources
      if (exercise.sets !== undefined && exercise.sets !== null && exercise.sets !== '') {
        exerciseSets = parsePositiveInt(exercise.sets, 1);
      } else if (exercise.Sets !== undefined && exercise.Sets !== null && exercise.Sets !== '') {
        exerciseSets = parsePositiveInt(exercise.Sets, 1);
      }
      
      // Try to get reps from various possible sources  
      if (exercise.reps !== undefined && exercise.reps !== null && exercise.reps !== '') {
        exerciseReps = parsePositiveInt(exercise.reps, 1);
      } else if (exercise.Reps !== undefined && exercise.Reps !== null && exercise.Reps !== '') {
        exerciseReps = parsePositiveInt(exercise.Reps, 1);
      }
      
      const exerciseTotalReps = exerciseSets * exerciseReps;
      
      totalSets += exerciseSets;
      totalReps += exerciseTotalReps;
      
      if (index < currentExerciseIndex) {
        // Completely finished exercises
        completedSets += exerciseSets;
        completedReps += exerciseTotalReps;
      } else if (index === currentExerciseIndex) {
        // Current exercise - check if we've completed all sets and reps
        if (currentSet >= exerciseSets && currentRep >= exerciseReps) {
          // Exercise is fully completed
          completedSets += exerciseSets;
          completedReps += exerciseTotalReps;
        } else {
          // Exercise is in progress - add completed sets and current rep progress
          const completedSetsInCurrentExercise = currentSet - 1;
          const completedRepsInCurrentSet = currentRep - 1;
          completedSets += completedSetsInCurrentExercise;
          completedReps += (completedSetsInCurrentExercise * exerciseReps) + completedRepsInCurrentSet;
        }
      }
    });

    // Calculate total blocks based on assignment type
    let totalBlocks = 0;
    let completedBlocks = 0;
    
    if (assignment.assignment_type === 'weekly') {
      // For weekly plans, count blocks in daily workouts
      const dailyWorkouts = assignment.exercise_block?.daily_workouts || {};
      totalBlocks = Object.values(dailyWorkouts).reduce((total: number, dayWorkout: any) => {
        if (Array.isArray(dayWorkout)) {
          // New blocks format
          return total + dayWorkout.length;
        } else if (dayWorkout && typeof dayWorkout === 'object' && 
                   !(dayWorkout as any).is_rest_day && 
                   (dayWorkout as any).exercises?.length > 0) {
          // Old format - count as 1 block if has exercises
          return total + 1;
        }
        return total;
      }, 0);
      
      // For completed blocks, we need to know which blocks are done
      // This is simplified - in reality we'd need to track block-level progress
      completedBlocks = Math.floor(currentExerciseIndex / Math.max(1, Math.ceil(exercises.length / Math.max(1, totalBlocks))));
    } else if (assignment.assignment_type === 'monthly') {
      // For monthly plans, use weekly structure
      totalBlocks = assignment.exercise_block?.weekly_structure?.length || assignment.exercise_block?.total_weeks || 1;
      completedBlocks = Math.floor(currentExerciseIndex / Math.max(1, Math.ceil(exercises.length / totalBlocks)));
    }

    // Calculate completed exercises
    let completedExercises = currentExerciseIndex; // All exercises before current are completed
    
    // Check if current exercise is also completed
    if (currentExerciseIndex < exercises.length) {
      const currentExercise = exercises[currentExerciseIndex];
      if (currentExercise) {
        const exerciseSets = parsePositiveInt(currentExercise.sets || currentExercise.Sets, 1);
        const exerciseReps = parsePositiveInt(currentExercise.reps || currentExercise.Reps, 1);
        
        // If we've completed all sets and reps of current exercise, count it as completed
        if (currentSet >= exerciseSets && currentRep >= exerciseReps) {
          completedExercises += 1;
        }
      }
    }

    return {
      blocks: totalBlocks > 0 ? { current: completedBlocks, total: totalBlocks } : null,
      exercises: { current: completedExercises, total: exercises.length },
      sets: { current: completedSets, total: totalSets },
      reps: { current: completedReps, total: totalReps }
    };
  };

  const detailedProgress = getDetailedProgress();

  const handleStart = () => {
    if (onExecute) {
      onExecute(assignment.id);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone.')) {
      resetProgress.mutate(assignment.id);
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (assignment.status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'in_progress':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>In Progress</span>;
      case 'assigned':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Assigned</span>;
      case 'overdue':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Overdue</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getActionButton = () => {
    if (isCompleted) {
      return (
        <button
          onClick={handleReset}
          disabled={resetProgress.isPending}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          {resetProgress.isPending ? 'Resetting...' : 'Reset'}
        </button>
      );
    }

    if (isInProgress) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-4 h-4" />
            Continue
          </button>
          <button
            onClick={handleReset}
            disabled={resetProgress.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (isAssigned) {
      return (
        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Play className="w-4 h-4" />
          Start
        </button>
      );
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${details.color} text-white`}>
            {details.icon}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{details.title}</h4>
            <p className="text-sm text-gray-500">{details.subtitle}</p>
            <div className="text-xs text-gray-400 mt-1">
              {detailedProgress.exercises.current}/{detailedProgress.exercises.total} exercises
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{progress_pct}%</div>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${details.color} transition-all duration-300`}
                style={{ width: `${progress_pct}%` }}
              />
            </div>
          </div>
          {showActions && getActionButton()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${details.color} text-white`}>
              {details.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{details.title}</h3>
              <p className="text-sm text-gray-500">{details.subtitle}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {details.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {details.duration}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {details.exercises} {assignment.assignment_type === 'single' ? 'exercises' : 'items'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <div className="text-sm text-gray-500">
              {formatDate(assignment.start_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progress_pct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${details.color} transition-all duration-500 ease-out`}
            style={{ width: `${progress_pct}%` }}
          />
        </div>
        
        {/* Detailed Progress Breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {detailedProgress.blocks && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Blocks:</span>
              <span className="font-medium text-gray-900">
                {detailedProgress.blocks.current}/{detailedProgress.blocks.total}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Exercises:</span>
            <span className="font-medium text-gray-900">
              {detailedProgress.exercises.current}/{detailedProgress.exercises.total}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Sets:</span>
            <span className="font-medium text-gray-900">
              {detailedProgress.sets.current}/{detailedProgress.sets.total}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Reps:</span>
            <span className="font-medium text-gray-900">
              {detailedProgress.reps.current}/{detailedProgress.reps.total}
            </span>
          </div>
        </div>

        {/* Progress Details */}
        {assignment.progress.started_at && (
          <div className="mt-2 text-xs text-gray-500">
            Started: {formatDate(assignment.progress.started_at)}
            {assignment.progress.completed_at && (
              <> • Completed: {formatDate(assignment.progress.completed_at)}</>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {detailedProgress.exercises.current} of {detailedProgress.exercises.total} exercises completed
          </div>
          {getActionButton()}
        </div>
      )}
    </div>
  );
}

// Export a specialized version for different contexts
export function TodaysWorkoutCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={false}
    />
  );
}

export function CompactAssignmentCard({ assignment, onExecute }: { assignment: WorkoutAssignment; onExecute?: (id: string) => void }) {
  return (
    <UnifiedAssignmentCard 
      assignment={assignment} 
      onExecute={onExecute}
      showActions={true}
      compact={true}
    />
  );
} 