import React from 'react';
import { ExerciseExecutionModal } from './ExerciseExecutionModal';
import { BlockWorkoutExecution } from './execution/BlockWorkoutExecution';
import { SequentialWorkoutExecution } from './execution/SequentialWorkoutExecution';

interface Workout {
  id: string;
  name: string;
  exercises: any[];
  is_block_based?: boolean;
  blocks?: any[];
  flow_type?: 'sequential' | 'circuit';
  circuit_rounds?: number;
}

interface WorkoutExecutionRouterProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  exerciseIdx: number;
  timer: number;
  running: boolean;
  onUpdateTimer: (timer: number) => void;
  onUpdateRunning: (running: boolean) => void;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
  onFinishWorkout: () => void;
  onShowVideo: (exerciseName: string, videoUrl: string) => void;
}

export const WorkoutExecutionRouter: React.FC<WorkoutExecutionRouterProps> = (props) => {
  const { workout } = props;

  // Determine which execution component to use
  if (!workout) {
    return null;
  }

  // Use block-based execution for workouts with blocks
  if (workout.is_block_based && workout.blocks && workout.blocks.length > 0) {
    return <BlockWorkoutExecution {...props} workout={workout as any} />;
  }

  // Use sequential execution for regular workouts (preferred over legacy modal)
  if (workout.exercises && workout.exercises.length > 0) {
    return <SequentialWorkoutExecution {...props} workout={workout as any} />;
  }

  // Fall back to original execution modal for edge cases
  return <ExerciseExecutionModal {...props} />;
}; 