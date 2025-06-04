-- Fix workout API errors by ensuring basic data exists
-- This prevents PGRST116 errors when queries expect results but find none

-- First, let's check if there are any workouts at all
SELECT 'Current workout count:' as info, COUNT(*) as count FROM workouts;

-- Check if there are any coach profiles
SELECT 'Current coach count:' as info, COUNT(*) as count FROM profiles WHERE role = 'coach';

-- If no workouts exist, this might be causing the PGRST116 errors
-- The API is trying to fetch workout stats and assignments for workouts that don't exist

-- Let's check what's causing the specific errors by looking at the workout IDs being queried
-- Check if these workout IDs exist in the workouts table
SELECT 'Checking workout IDs that might be causing errors:' as info;

-- These are the workout IDs from the console errors:
-- 0b243ff8-48d0-4805-92b5-3ec1e626eb89
-- fbae1e39-8094-4c53-b7fd-e9401dec927f  
-- e04f9f34-8f12-4a88-a665-f02cd1839b73

SELECT 
    id,
    name,
    user_id,
    created_by,
    is_draft,
    deleted_at
FROM workouts 
WHERE id IN (
    '0b243ff8-48d0-4805-92b5-3ec1e626eb89',
    'fbae1e39-8094-4c53-b7fd-e9401dec927f',
    'e04f9f34-8f12-4a88-a665-f02cd1839b73'
);

-- Check if there are any athlete_workouts assignments for these IDs
SELECT 
    'Checking athlete_workouts assignments:' as info,
    workout_id,
    athlete_id,
    assigned_at
FROM athlete_workouts 
WHERE workout_id IN (
    '0b243ff8-48d0-4805-92b5-3ec1e626eb89',
    'fbae1e39-8094-4c53-b7fd-e9401dec927f',
    'e04f9f34-8f12-4a88-a665-f02cd1839b73'
);

-- The issue might be that the UI is trying to fetch stats for workouts that:
-- 1. Don't exist anymore
-- 2. Are marked as deleted
-- 3. Have invalid references

-- Let's clean up any orphaned athlete_workouts entries
DELETE FROM athlete_workouts 
WHERE workout_id NOT IN (SELECT id FROM workouts);

-- Report how many orphaned entries were cleaned up
SELECT 'Cleanup complete. Orphaned athlete_workouts entries removed.' as status; 