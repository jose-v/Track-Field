-- Fix user ID mismatch for deleted test workouts

-- Step 1: Check current test workouts and their user_ids
SELECT 'Current test workouts:' as info;
SELECT id, name, user_id, deleted_at, deleted_by 
FROM workouts 
WHERE name LIKE '%Test Deleted%'
ORDER BY name;

-- Step 2: Update the test workouts to use your current user ID
UPDATE workouts 
SET 
  user_id = '5c4b060d-c9ef-451f-9a93-6b8872bfe1ba',
  deleted_by = '5c4b060d-c9ef-451f-9a93-6b8872bfe1ba'
WHERE name LIKE '%Test Deleted%'
  AND deleted_at IS NOT NULL;

-- Step 3: Verify the update worked
SELECT 'Updated test workouts:' as result;
SELECT id, name, user_id, deleted_at, deleted_by 
FROM workouts 
WHERE name LIKE '%Test Deleted%'
ORDER BY name;

-- Step 4: Double-check with the API query format
SELECT 'API query check - deleted workouts for your user:' as api_check;
SELECT id, name, type, user_id, deleted_at, deleted_by 
FROM workouts 
WHERE user_id = '5c4b060d-c9ef-451f-9a93-6b8872bfe1ba'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC; 