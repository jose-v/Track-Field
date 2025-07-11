# Legacy Execution Components

This folder contains **legacy execution components** that are no longer actively developed but kept for fallback compatibility.

## Components

### `ExerciseExecutionModal.tsx`
- **Status:** Legacy/Deprecated
- **Purpose:** Original monolithic workout execution modal
- **Usage:** Fallback component in `WorkoutExecutionRouter` for edge cases
- **Replacement:** Use `BlockWorkoutExecution` or `SequentialWorkoutExecution` instead

## Current Architecture

The **current execution system** uses:

- **`WorkoutExecutionRouter.tsx`** - Routes to appropriate execution component
- **`BlockWorkoutExecution.tsx`** - For block-based workouts (`is_block_based: true`)  
- **`SequentialWorkoutExecution.tsx`** - For traditional workouts
- **`UnifiedWorkoutExecution.tsx`** - For unified assignments

## Migration Status

✅ **Block-based workouts** → `BlockWorkoutExecution`  
✅ **Regular workouts** → `SequentialWorkoutExecution`  
✅ **Unified assignments** → `UnifiedWorkoutExecution`  
⚠️ **Edge cases** → `ExerciseExecutionModal` (legacy fallback)

## Development Guidelines

- **DO NOT** modify components in this legacy folder
- **DO** work on the current execution components in the parent folder
- **DO** update the router logic to reduce dependency on legacy components
- **DO** eventually migrate away from legacy components entirely

---

*Legacy components moved here on: 2025-01-11*
*Reason: Prevent accidental modification during development* 