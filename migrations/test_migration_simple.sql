-- Simple test migration for exercise library system
-- Use this to test the system before full exercise categorization is complete

-- Step 1: Create the exercise library table
\i migrations/create_exercise_library.sql

-- Step 2: Populate with basic test exercises (20 exercises across 5 categories)
\i migrations/populate_test_exercises.sql

-- Step 3: Create workout_exercises table and migration functions
\i migrations/update_workouts_for_exercise_library.sql

-- Step 4: Verify the test setup
SELECT 'Exercise Library Test Setup Complete' as status;

-- Show exercise counts by category
SELECT 
    category,
    COUNT(*) as exercise_count,
    STRING_AGG(name, ', ' ORDER BY name) as exercises
FROM public.exercise_library 
WHERE is_system_exercise = true
GROUP BY category 
ORDER BY category;

-- Show total counts
SELECT 
    COUNT(*) as total_exercises,
    COUNT(*) FILTER (WHERE is_system_exercise = true) as system_exercises,
    COUNT(*) FILTER (WHERE is_system_exercise = false) as custom_exercises
FROM public.exercise_library; 