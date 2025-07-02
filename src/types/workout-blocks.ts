// Base types (matching existing interfaces)
interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  flow_type?: 'sequential' | 'circuit';
  circuit_rounds?: number;
}

// New workout block system types
export interface ExerciseBlock {
  id: string;
  name?: string; // Optional block name (e.g., "Warm-up", "Main Set")
  exercises: Exercise[];
  
  // Block-level execution settings
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  rounds?: number; // For circuit/superset blocks
  timeCapMinutes?: number; // For EMOM/AMRAP
  
  // Rest settings
  restBetweenExercises?: number; // seconds
  restBetweenRounds?: number; // seconds
  restAfterBlock?: number; // Rest before next block
  
  // Block metadata
  notes?: string;
  color?: string; // Visual distinction
  isCollapsed?: boolean; // UI state
  
  // Advanced settings
  intensity?: 'low' | 'moderate' | 'high';
  category?: 'warmup' | 'main' | 'accessory' | 'cooldown' | 'conditioning';
}

// Enhanced workout structure
export interface BlockBasedWorkout extends Omit<Workout, 'exercises'> {
  blocks: ExerciseBlock[];
  
  // Legacy support for backwards compatibility
  exercises?: Exercise[]; // Will be auto-migrated to single block
}

// Block template for reusability
export interface BlockTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'warmup' | 'main' | 'accessory' | 'cooldown' | 'conditioning';
  exercises: Omit<Exercise, 'id'>[]; // Template exercises without IDs
  defaultSettings: Pick<ExerciseBlock, 'flow' | 'rounds' | 'restBetweenExercises'>;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
}

// Execution state for blocks
export interface BlockExecutionState {
  currentBlockIndex: number;
  currentExerciseIndex: number;
  currentRound?: number; // For circuit blocks
  blockStartTime?: number;
  exerciseStartTime?: number;
  completedBlocks: string[];
  completedExercises: string[];
} 