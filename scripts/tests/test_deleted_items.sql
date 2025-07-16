-- Test and create soft-deleted items for testing the deleted tab

-- First, check if we have any existing soft-deleted items
SELECT 'Existing deleted workouts:' as status;
SELECT id, name, type, deleted_at FROM workouts 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

SELECT 'Existing deleted training plans:' as status;
SELECT id, name, deleted_at FROM training_plans 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Get a coach ID for testing
SELECT 'Available coaches:' as status;
SELECT id, first_name, last_name FROM profiles 
WHERE role = 'coach' 
LIMIT 3;

-- If no deleted items exist, create some test deleted items
-- First create a test workout and immediately soft delete it
WITH new_workout AS (
  INSERT INTO workouts (id, name, user_id, description, type, exercises, created_at)
  VALUES (
    gen_random_uuid(),
    'Test Deleted Workout 1',
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

-- Create a test training plan and immediately soft delete it
WITH new_plan AS (
  INSERT INTO training_plans (id, name, description, coach_id, month, year, weeks, created_at)
  VALUES (
    gen_random_uuid(),
    'Test Deleted Training Plan 1',
    'This is a test training plan for verifying the deleted tab functionality',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    '[]'::jsonb,
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
WHERE name LIKE 'Test Deleted%'
ORDER BY deleted_at DESC;

SELECT 'Test deleted training plans created:' as status;
SELECT id, name, deleted_at, deleted_by FROM training_plans 
WHERE name LIKE 'Test Deleted%'
ORDER BY deleted_at DESC; 