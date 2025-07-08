// Legacy components (backed up)
export { default as WorkoutCreatorWireframe } from './legacy/WorkoutCreatorWireframe';
export { default as Step1WorkoutDetails } from './legacy/Step1WorkoutDetails';
export { default as Step2ExercisePlanning } from './legacy/Step2ExercisePlanning';
export { default as Step3AthleteAssignment } from './legacy/Step3AthleteAssignment';
export { default as Step4ReviewSave } from './legacy/Step4ReviewSave';

// New block-first components
export { default as NewWorkoutCreator } from './NewWorkoutCreator';
export { default as Step1TemplateSelection } from './Step1TemplateSelection';
export { default as Step2BlockBuilder } from './Step2BlockBuilder';
export { default as Step3ExerciseAssignment } from './Step3ExerciseAssignment';

// Export interfaces for external use
export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  sets?: string;
  reps?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
}

export interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown' | 'custom';
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  exercises: any[];
  restBetweenExercises: number;
  rounds?: number;
  timeLimit?: number;
  description?: string;
} 