-- Create unified view for exercise results analytics
-- This view combines active exercise_results with archived exercise_results_history

-- First, ensure the completed_at column exists in exercise_results_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercise_results_history' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE exercise_results_history ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE OR REPLACE VIEW exercise_results_for_analytics AS
SELECT
  id, athlete_id, workout_id, exercise_index, exercise_name,
  time_minutes, time_seconds, time_hundredths, sets_completed, reps_completed,
  weight_used, distance_meters, rpe_rating, notes, completed_at,
  created_at, updated_at,
  'active' as source, NULL as archived_at, NULL as archived_by, NULL as original_exercise_result_id
FROM exercise_results

UNION ALL

SELECT
  id as original_exercise_result_id, athlete_id, workout_id, exercise_index, exercise_name,
  time_minutes, time_seconds, time_hundredths, sets_completed, reps_completed,
  weight_used, distance_meters, rpe_rating, notes, COALESCE(completed_at, created_at) as completed_at,
  created_at, updated_at,
  'archived' as source, archived_at, archived_by, id as original_exercise_result_id
FROM exercise_results_history;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_results_analytics_athlete_id ON exercise_results_for_analytics(athlete_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_analytics_workout_id ON exercise_results_for_analytics(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_analytics_completed_at ON exercise_results_for_analytics(completed_at);
CREATE INDEX IF NOT EXISTS idx_exercise_results_analytics_source ON exercise_results_for_analytics(source);

-- Grant access to authenticated users
GRANT SELECT ON exercise_results_for_analytics TO authenticated;

-- Add comment
COMMENT ON VIEW exercise_results_for_analytics IS 'Unified view combining active and archived exercise results for comprehensive analytics'; 