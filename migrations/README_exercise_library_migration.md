# Exercise Library Migration Guide

## Overview

This migration transforms the exercise system from a JSONB-based approach to a proper relational database structure with privacy controls for custom exercises.

## Current State vs New Architecture

### Before (Current)
```
workouts.exercises: JSONB[]  // Array of exercise objects
exercise_results.exercise_name: TEXT  // String reference
custom_exercises: separate table (migration only)
```

### After (New Architecture)
```
exercise_library: Single source of truth for all exercises
workout_exercises: Junction table linking workouts to exercises
exercise_results.exercise_id: UUID  // Foreign key reference
```

## Key Features

### 1. **Unified Exercise Library**
- Single `exercise_library` table for all exercises
- ~400+ predefined system exercises
- Custom exercises with privacy controls

### 2. **Privacy Controls**
- **System Exercises**: Always public (`is_system_exercise: true, is_public: true`)
- **Private Custom**: Default for user-created exercises (`is_system_exercise: false, is_public: false`)
- **Public Custom**: Optional sharing (`is_system_exercise: false, is_public: true`)

### 3. **Proper Relationships**
- Foreign key constraints ensure data integrity
- Referential integrity between workouts and exercises
- Usage tracking for popular exercises

## Migration Steps

### Step 1: Create Exercise Library
```sql
-- Run this first
\i migrations/create_exercise_library.sql
```

### Step 2: Populate System Exercises
```sql
-- Populate with ~400 predefined exercises
\i migrations/populate_system_exercises.sql
\i migrations/populate_system_exercises_part2.sql
```

### Step 3: Update Workout Structure
```sql
-- Create workout_exercises table and migration functions
\i migrations/update_workouts_for_exercise_library.sql
```

### Step 4: Migrate Existing Data
```sql
-- Run the migration function to convert JSONB exercises
SELECT migrate_workout_exercises();
```

### Step 5: Verify Migration
```sql
-- Check exercise library population
SELECT COUNT(*) as total_exercises FROM public.exercise_library;
SELECT category, COUNT(*) as count FROM public.exercise_library GROUP BY category ORDER BY count DESC;

-- Check workout_exercises migration
SELECT COUNT(*) as migrated_exercises FROM public.workout_exercises;

-- Check for any missing exercises
SELECT DISTINCT jsonb_array_elements_text(exercises) as exercise_name
FROM public.workouts 
WHERE exercises IS NOT NULL 
AND jsonb_array_length(exercises) > 0
AND NOT EXISTS (
    SELECT 1 FROM public.exercise_library 
    WHERE name = jsonb_array_elements_text(exercises)
);
```

## Database Schema

### exercise_library
```sql
CREATE TABLE public.exercise_library (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT CHECK (...),
    video_url TEXT,
    default_instructions TEXT,
    difficulty TEXT CHECK (...),
    muscle_groups TEXT[],
    equipment TEXT[],
    user_id UUID REFERENCES profiles(id),
    is_system_exercise BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    organization_id UUID DEFAULT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### workout_exercises
```sql
CREATE TABLE public.workout_exercises (
    id UUID PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id),
    exercise_id UUID REFERENCES exercise_library(id),
    order_in_workout INTEGER NOT NULL,
    prescribed_sets TEXT,
    prescribed_reps TEXT,
    prescribed_duration TEXT,
    prescribed_distance TEXT,
    prescribed_weight TEXT,
    rest_interval TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (workout_id, order_in_workout)
);
```

## Row Level Security (RLS)

### Exercise Library Visibility
```sql
-- Users can see:
-- 1. All system exercises (is_system_exercise = true)
-- 2. All public custom exercises (is_public = true)
-- 3. Their own private exercises (user_id = auth.uid())
```

### Privacy Controls
- **Default**: Custom exercises are private
- **Optional**: Users can make exercises public
- **System**: Predefined exercises are always public

## Frontend Integration

### Exercise Selection
```typescript
// Fetch available exercises for user
const exercises = await supabase
  .from('exercise_library')
  .select('*')
  .order('name');

// Exercises are automatically filtered by RLS:
// - System exercises (always visible)
// - Public custom exercises (community)
// - User's private exercises
```

### Privacy Toggle
```typescript
// Toggle exercise privacy
const togglePrivacy = async (exerciseId: string, isPublic: boolean) => {
  await supabase
    .from('exercise_library')
    .update({ is_public: isPublic })
    .eq('id', exerciseId);
};
```

### Workout Creation
```typescript
// Create workout with exercises
const createWorkout = async (workoutData, exercises) => {
  // 1. Create workout
  const { data: workout } = await supabase
    .from('workouts')
    .insert(workoutData)
    .select()
    .single();

  // 2. Add exercises
  const workoutExercises = exercises.map((ex, index) => ({
    workout_id: workout.id,
    exercise_id: ex.exercise_id,
    order_in_workout: index + 1,
    prescribed_sets: ex.sets,
    prescribed_reps: ex.reps,
    // ... other prescription details
  }));

  await supabase
    .from('workout_exercises')
    .insert(workoutExercises);
};
```

## Benefits

### Technical Benefits
- ✅ **Referential Integrity**: Foreign key constraints
- ✅ **Performance**: Proper indexing and relationships
- ✅ **Scalability**: Normalized data structure
- ✅ **Data Consistency**: Single source of truth

### User Benefits
- ✅ **Privacy Protection**: Keep proprietary drills private
- ✅ **Community Sharing**: Optional public sharing
- ✅ **Unified Experience**: All exercises in one library
- ✅ **Usage Analytics**: Track popular exercises

### Coach Benefits
- ✅ **Proprietary Drills**: Private by default
- ✅ **Community Discovery**: Access to public exercises
- ✅ **Attribution**: Credit for shared exercises
- ✅ **Usage Insights**: See how often exercises are used

## Rollback Plan

If needed, the migration can be rolled back:

1. **Preserve JSONB**: Keep `workouts.exercises` column during migration
2. **Verification Period**: Run both systems in parallel
3. **Rollback Function**: Convert back from relational to JSONB if needed

## Future Enhancements

### Phase 2: Advanced Features
- Exercise rating/review system
- Exercise recommendation engine
- Video/image attachments
- Exercise variations and progressions

### Phase 3: Organization Features
- Team/school level exercise sharing
- Organization-specific exercise libraries
- Bulk exercise import/export

### Phase 4: Analytics
- Exercise popularity tracking
- Usage analytics for coaches
- Performance correlation analysis

## Support

For questions or issues during migration:
1. Check the verification queries above
2. Review the migration logs for any NOTICE messages
3. Test with a small subset of data first
4. Keep backups of original data

## Migration Checklist

- [ ] Run `create_exercise_library.sql`
- [ ] Run `populate_system_exercises.sql`
- [ ] Run `populate_system_exercises_part2.sql`
- [ ] Run `update_workouts_for_exercise_library.sql`
- [ ] Execute `SELECT migrate_workout_exercises();`
- [ ] Verify exercise library population
- [ ] Verify workout_exercises migration
- [ ] Check for missing exercises
- [ ] Update frontend code to use new structure
- [ ] Test exercise creation and privacy controls
- [ ] Test workout creation with new structure
- [ ] Deploy and monitor 