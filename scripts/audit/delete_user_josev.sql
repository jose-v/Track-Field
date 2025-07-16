-- Delete User Profile: josev.gfx@gmail.com (ID: 5d9dabaf-453f-4bf5-a198-def993c55622)
-- This script will safely remove the user and all related data

-- First, let's verify the user exists and see what data we're dealing with
SELECT 'User Profile Info:' as info;
SELECT id, email, role, first_name, last_name, created_at 
FROM profiles 
WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622' OR email = 'josev.gfx@gmail.com';

-- Check what related data exists
SELECT 'Related Data Count:' as info;
SELECT 
  (SELECT COUNT(*) FROM athletes WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622') as athlete_records,
  (SELECT COUNT(*) FROM coaches WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622') as coach_records,
  (SELECT COUNT(*) FROM team_managers WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622') as team_manager_records,
  (SELECT COUNT(*) FROM workouts WHERE user_id = '5d9dabaf-453f-4bf5-a198-def993c55622') as workout_records,
  (SELECT COUNT(*) FROM athlete_wellness_surveys WHERE athlete_id = '5d9dabaf-453f-4bf5-a198-def993c55622') as wellness_records,
  (SELECT COUNT(*) FROM personal_records WHERE athlete_id = '5d9dabaf-453f-4bf5-a198-def993c55622') as pr_records,
  (SELECT COUNT(*) FROM track_meets WHERE coach_id = '5d9dabaf-453f-4bf5-a198-def993c55622' OR athlete_id = '5d9dabaf-453f-4bf5-a198-def993c55622') as meet_records;

-- BEGIN TRANSACTION for safe deletion
BEGIN;

-- Step 1: Delete from Supabase Auth table (if you have admin access)
-- Note: This requires admin privileges and may need to be done through Supabase dashboard
-- DELETE FROM auth.users WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622';

-- Step 2: Delete from profiles table (this will cascade to most related tables automatically)
-- The CASCADE relationships will automatically delete:
-- - athletes record (if exists)
-- - coaches record (if exists)  
-- - team_managers record (if exists)
-- - workouts created by this user
-- - athlete_wellness_surveys
-- - personal_records
-- - coach_athletes relationships
-- - workout_assignments (assigned_by will be set to NULL)
-- - athlete_workouts
-- - athlete_meet_events

DELETE FROM profiles 
WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622' 
   OR email = 'josev.gfx@gmail.com';

-- Step 3: Clean up any remaining references that might use SET NULL
-- Update track_meets where this user was referenced
UPDATE track_meets 
SET coach_id = NULL 
WHERE coach_id = '5d9dabaf-453f-4bf5-a198-def993c55622';

UPDATE track_meets 
SET athlete_id = NULL 
WHERE athlete_id = '5d9dabaf-453f-4bf5-a198-def993c55622';

-- Update workout_assignments where this user was the assigner
UPDATE workout_assignments 
SET assigned_by = NULL 
WHERE assigned_by = '5d9dabaf-453f-4bf5-a198-def993c55622';

-- Update athlete_meet_events where this user was the assigner
UPDATE athlete_meet_events 
SET assigned_by = NULL 
WHERE assigned_by = '5d9dabaf-453f-4bf5-a198-def993c55622';

-- Verify deletion was successful
SELECT 'Verification - User should not exist:' as info;
SELECT COUNT(*) as remaining_profiles 
FROM profiles 
WHERE id = '5d9dabaf-453f-4bf5-a198-def993c55622' OR email = 'josev.gfx@gmail.com';

-- COMMIT the transaction
COMMIT;

-- Final cleanup message
SELECT 'User deletion completed successfully!' as result; 