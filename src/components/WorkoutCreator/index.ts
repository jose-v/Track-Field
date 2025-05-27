// Export all WorkoutCreator wireframe components
export { default as WorkoutCreatorWireframe } from './WorkoutCreatorWireframe';
export { default as Step1WorkoutDetails } from './Step1WorkoutDetails';
export { default as Step2ExercisePlanning } from './Step2ExercisePlanning';
export { default as Step3AthleteAssignment } from './Step3AthleteAssignment';
export { default as Step4ReviewSave } from './Step4ReviewSave';

// Export interfaces for external use
export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface SelectedExercise extends Exercise {
  instanceId: string;
  sets?: string;
  reps?: string;
  notes?: string;
}

export interface DayWorkout {
  day: string;
  exercises: SelectedExercise[];
  isRestDay: boolean;
}

export interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
} 