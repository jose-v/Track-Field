-- Update existing workout descriptions to simplified format
-- This script will clean up the verbose descriptions created by the old workout creator

-- Update weekly workouts
UPDATE workouts 
SET description = 'Weekly Training Plan'
WHERE template_type = 'weekly' 
  AND (
    description LIKE '%Weekly training plan created with Workout Creator%' OR
    description LIKE '%WEEKLY_PLAN_DATA%' OR
    description LIKE '%Weekly training plan%'
  );

-- Update single day workouts  
UPDATE workouts 
SET description = 'Single Day Workout'
WHERE (template_type = 'single' OR template_type IS NULL)
  AND description LIKE '%Single day workout created with Workout Creator%';

-- Also update any remaining verbose descriptions that might not match exactly
UPDATE workouts 
SET description = CASE 
  WHEN template_type = 'weekly' THEN 'Weekly Training Plan'
  ELSE 'Single Day Workout'
END
WHERE description LIKE '%created with Workout Creator%';

-- Clean up any descriptions with the WEEKLY_PLAN_DATA suffix
UPDATE workouts 
SET description = REGEXP_REPLACE(description, '\n\n\[WEEKLY_PLAN_DATA\]$', '', 'g')
WHERE description LIKE '%[WEEKLY_PLAN_DATA]%';

-- Show the results
SELECT 
  template_type,
  COUNT(*) as count,
  description
FROM workouts 
GROUP BY template_type, description
ORDER BY template_type, description; 