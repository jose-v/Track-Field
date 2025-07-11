// Unified Assignment System Components
export { 
  UnifiedAssignmentCard,
  TodaysWorkoutCard,
  CompactAssignmentCard 
} from '../UnifiedAssignmentCard';

export { UnifiedWorkoutExecution } from '../UnifiedWorkoutExecution';

// Re-export hooks for convenience
export {
  useUnifiedAssignments,
  useUnifiedTodaysWorkout,
  useUnifiedAssignmentActions,
  useUnifiedWorkoutExecution,
  useUnifiedAssignmentManager
} from '../../hooks/useUnifiedAssignments';

// Re-export service
export { AssignmentService } from '../../services/assignmentService';
export type { WorkoutAssignment } from '../../services/assignmentService'; 