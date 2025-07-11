# Workout Execution Architecture

This directory contains the new modular workout execution system that replaces the monolithic `ExerciseExecutionModal`.

📁 **Legacy components** have been moved to the `./legacy/` folder - **do not modify them during development**.

## Components Overview

### `BaseWorkoutExecution.tsx`
Shared base logic and UI components used by all execution types:
- Timer management and countdown logic
- RPE tracking and submission
- Exercise media display
- Common hooks and utility functions
- Shared UI wrapper (`SharedWorkoutUI`)

### `BlockWorkoutExecution.tsx`
Specialized execution for block-based workouts:
- Handles workouts with `is_block_based: true` and `blocks` array
- Block-aware navigation and progress tracking
- Proper parsing of sets/reps from block data (stored as strings)
- Flow-specific logic (sequential, circuit, superset, etc.)
- Block progress indicators

### `SequentialWorkoutExecution.tsx`
Clean execution for traditional workouts:
- Handles standard workout structure with flat `exercises` array
- Sequential and circuit flow support
- Set/rep progression tracking
- Traditional workout progress calculation

## Usage

### Router Component (`WorkoutExecutionRouter.tsx`)
The main entry point that automatically selects the correct execution component:

```tsx
import { WorkoutExecutionRouter } from './components/WorkoutExecutionRouter';

<WorkoutExecutionRouter
  isOpen={isOpen}
  onClose={onClose}
  workout={workout}
  exerciseIdx={exerciseIdx}
  // ... other props
/>
```

### Routing Logic
1. **Block-based workouts**: Uses `BlockWorkoutExecution` when `workout.is_block_based && workout.blocks.length > 0`
2. **Regular workouts**: Uses `SequentialWorkoutExecution` for standard exercise arrays
3. **Fallback**: Uses legacy `ExerciseExecutionModal` (from `./legacy/`) for edge cases

## Benefits of This Architecture

### ✅ **Resolved Issues**
- **Sets/Reps Display**: Block-based workouts now correctly parse string values from `blocks` data
- **Complex Logic**: Each component handles one workout type cleanly
- **Debugging**: Isolated logic makes it easier to identify and fix issues
- **React Hooks**: No more hook ordering violations from conditional logic

### ✅ **Improved Maintainability**
- **Separation of Concerns**: Each component has a single responsibility
- **Type Safety**: Proper interfaces for each workout type
- **Shared Logic**: Common functionality abstracted to base component
- **Extensibility**: Easy to add new execution types (circuit, EMOM, etc.)

### ✅ **Performance**
- **Reduced Bundle Size**: Tree-shaking can eliminate unused execution types
- **Faster Rendering**: Less conditional logic in render paths
- **Better Caching**: React can optimize each component independently

## Adding New Execution Types

To add a new execution type (e.g., `CircuitWorkoutExecution`):

1. Create new component extending `BaseWorkoutExecutionProps`
2. Import shared logic from `BaseWorkoutExecution`
3. Implement type-specific navigation and progress logic
4. Add routing logic to `WorkoutExecutionRouter`
5. Export from `index.ts`

Example:
```tsx
// CircuitWorkoutExecution.tsx
import { SharedWorkoutUI, useWorkoutExecutionState } from './BaseWorkoutExecution';

export const CircuitWorkoutExecution: React.FC<Props> = (props) => {
  const state = useWorkoutExecutionState();
  // Circuit-specific logic here...
  
  return (
    <SharedWorkoutUI {...props} state={state}>
      {/* Circuit-specific UI */}
    </SharedWorkoutUI>
  );
};
```

## Migration Notes

### From `ExerciseExecutionModal`
Replace imports of `ExerciseExecutionModal` with `WorkoutExecutionRouter`:

```tsx
// Before
import { ExerciseExecutionModal } from './ExerciseExecutionModal';
<ExerciseExecutionModal {...props} />

// After  
import { WorkoutExecutionRouter } from './WorkoutExecutionRouter';
<WorkoutExecutionRouter {...props} />
```

The props interface remains the same, making migration seamless.

### Legacy Support
The original `ExerciseExecutionModal` has been moved to `./legacy/ExerciseExecutionModal.tsx` and is still available as a fallback for edge cases. It will be gradually phased out as we validate the new architecture.

⚠️ **Important:** Do not modify components in the `./legacy/` folder. Work on the current execution components instead.

## Utilities

### `parsePositiveInt(value, fallback)`
Safely converts string/number values to positive integers with fallback:
```tsx
const sets = parsePositiveInt(exercise.sets, 1); // Always returns positive integer
```

### Video URL Mapping
`getVideoUrl(exerciseName)` provides exercise-specific tutorial videos based on exercise name patterns.

### Exercise Type Detection
`isRunExercise(exerciseName)` determines if special run time input should be shown. 