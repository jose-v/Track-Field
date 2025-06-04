-- Final fixed test script for creating soft-deleted items for testing the deleted tab

-- First, check if we have any existing soft-deleted items
SELECT 'Existing deleted workouts:' as status;
SELECT id, name, type, deleted_at FROM workouts 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;

SELECT 'Existing deleted training plans:' as status;
SELECT id, name, deleted_at FROM training_plans 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;

-- Get a coach ID for testing
SELECT 'Available coaches:' as status;
SELECT id, first_name, last_name FROM profiles 
WHERE role = 'coach' 
LIMIT 3;

-- Check the actual structure of training_plans table to see all required columns
SELECT 'Training plans table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'training_plans' 
ORDER BY ordinal_position;

-- Create test deleted items with all required columns
-- First create a test workout and immediately soft delete it
WITH new_workout AS (
  INSERT INTO workouts (name, user_id, description, type, exercises, created_at)
  VALUES (
    'Test Deleted Workout - Final',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'This is a test workout for verifying the deleted tab functionality',
    'Strength',
    '[]'::jsonb,
    NOW()
  )
  RETURNING id, user_id
)
UPDATE workouts 
SET 
  deleted_at = NOW(),
  deleted_by = (SELECT user_id FROM new_workout)
WHERE id = (SELECT id FROM new_workout);

-- Create a test training plan with all required fields including start_date and end_date
WITH new_plan AS (
  INSERT INTO training_plans (
    name, 
    description, 
    coach_id, 
    month, 
    year, 
    weeks, 
    start_date,
    end_date,
    created_at
  )
  VALUES (
    'Test Deleted Training Plan - Final',
    'This is a test training plan for verifying the deleted tab functionality',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    '[]'::jsonb,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '4 weeks', -- End date 4 weeks from start
    NOW()
  )
  RETURNING id, coach_id
)
UPDATE training_plans 
SET 
  deleted_at = NOW(),
  deleted_by = (SELECT coach_id FROM new_plan)
WHERE id = (SELECT id FROM new_plan);

-- Verify the test items were created and soft deleted
SELECT 'Test deleted workouts created:' as status;
SELECT id, name, type, deleted_at, deleted_by FROM workouts 
WHERE name LIKE '%Test Deleted%Final%'
ORDER BY deleted_at DESC;

SELECT 'Test deleted training plans created:' as status;
SELECT id, name, start_date, end_date, deleted_at, deleted_by FROM training_plans 
WHERE name LIKE '%Test Deleted%Final%'
ORDER BY deleted_at DESC; 