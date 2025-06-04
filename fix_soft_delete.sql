-- Fix the existing workout and create a better approach for soft-deleting

-- Step 1: Soft-delete the workout that was just created
UPDATE workouts 
SET 
  deleted_at = NOW(),
  deleted_by = user_id
WHERE name = 'Simple Test Deleted Workout'
  AND deleted_at IS NULL;

-- Step 2: Verify it worked
SELECT 'Soft-deleted workout:' as status;
SELECT id, name, type, deleted_at, deleted_by 
FROM workouts 
WHERE name = 'Simple Test Deleted Workout';

-- Step 3: Also create one more simple deleted workout with a different approach
INSERT INTO workouts (name, user_id, description, type, exercises, deleted_at, deleted_by)
VALUES (
  'Another Test Deleted Workout',
  (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
  'Second test workout for deleted tab',
  'Test',
  '[]'::jsonb,
  NOW(),
  (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1)
);

-- Step 4: Check all deleted workouts now
SELECT 'All deleted workouts:' as final_check;
SELECT id, name, type, deleted_at, deleted_by 
FROM workouts 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC; 