-- Test the archive system functionality

-- 1. Check if the view was created successfully
SELECT 'Testing workouts_for_analytics view:' as test_step;
SELECT COUNT(*) as total_workouts FROM workouts_for_analytics;

-- 2. Check active vs archived counts
SELECT 
  source,
  COUNT(*) as count
FROM workouts_for_analytics 
GROUP BY source;

-- 3. Check if we can query the view with filters
SELECT 'Testing view with filters:' as test_step;
SELECT 
  name,
  type,
  source,
  created_at
FROM workouts_for_analytics 
WHERE user_id = (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;

-- 4. Test the archive functionality (if you have a workout to archive)
-- This would be done through the UI, but we can test the API call
SELECT 'Archive system ready for testing via UI' as status;

-- 5. Verify the history tables exist and are accessible
SELECT 'Checking history tables:' as test_step;
SELECT 
  'workout_history' as table_name,
  COUNT(*) as record_count
FROM workout_history
UNION ALL
SELECT 
  'exercise_results_history' as table_name,
  COUNT(*) as record_count
FROM exercise_results_history
UNION ALL
SELECT 
  'athlete_workouts_history' as table_name,
  COUNT(*) as record_count
FROM athlete_workouts_history; 