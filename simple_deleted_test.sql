-- Simple approach: Let's see what we're working with first, then create test data

-- Step 1: Investigate table structures completely
SELECT 'Training plans table - ALL column details:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  CASE WHEN is_nullable = 'NO' AND column_default IS NULL THEN 'REQUIRED!' ELSE 'Optional' END as requirement
FROM information_schema.columns 
WHERE table_name = 'training_plans' 
ORDER BY ordinal_position;

SELECT 'Workouts table - ALL column details:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  CASE WHEN is_nullable = 'NO' AND column_default IS NULL THEN 'REQUIRED!' ELSE 'Optional' END as requirement
FROM information_schema.columns 
WHERE table_name = 'workouts' 
ORDER BY ordinal_position;

-- Step 2: Check existing soft-deleted items
SELECT 'Existing deleted workouts:' as info;
SELECT id, name, type, deleted_at FROM workouts 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;

SELECT 'Existing deleted training plans:' as info;
SELECT id, name, deleted_at FROM training_plans 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;

-- Step 3: Let's just create a simple workout first (workouts seem easier)
WITH new_workout AS (
  INSERT INTO workouts (
    name, 
    user_id, 
    description, 
    type, 
    exercises
  )
  VALUES (
    'Simple Test Deleted Workout',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Simple test for deleted tab',
    'Test',
    '[]'::jsonb
  )
  RETURNING id, user_id
)
UPDATE workouts 
SET 
  deleted_at = NOW(),
  deleted_by = (SELECT user_id FROM new_workout)
WHERE id = (SELECT id FROM new_workout);

-- Step 4: Verify the workout was created and soft-deleted
SELECT 'Simple test workout created:' as result;
SELECT id, name, type, deleted_at, deleted_by 
FROM workouts 
WHERE name = 'Simple Test Deleted Workout'; 