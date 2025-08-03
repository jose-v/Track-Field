-- Fix RLS policies for workout history tables to allow INSERT operations
-- This migration adds INSERT policies for the archive functionality

-- Enable RLS on history tables (in case not already enabled)
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_results_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_workouts_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own archived workouts" ON workout_history;
DROP POLICY IF EXISTS "Users can view their own archived exercise results" ON exercise_results_history;
DROP POLICY IF EXISTS "Users can view their own archived assignments" ON athlete_workouts_history;

-- Create comprehensive policies for workout_history
CREATE POLICY "Users can insert their own archived workouts"
  ON workout_history FOR INSERT
  WITH CHECK (auth.uid() = archived_by);

CREATE POLICY "Users can view their own archived workouts"
  ON workout_history FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = archived_by);

-- Create comprehensive policies for exercise_results_history
CREATE POLICY "Users can insert their own archived exercise results"
  ON exercise_results_history FOR INSERT
  WITH CHECK (auth.uid() = archived_by);

CREATE POLICY "Users can view their own archived exercise results"
  ON exercise_results_history FOR SELECT
  USING (auth.uid() = archived_by);

-- Create comprehensive policies for athlete_workouts_history
CREATE POLICY "Users can insert their own archived assignments"
  ON athlete_workouts_history FOR INSERT
  WITH CHECK (auth.uid() = archived_by);

CREATE POLICY "Users can view their own archived assignments"
  ON athlete_workouts_history FOR SELECT
  USING (auth.uid() = archived_by);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON workout_history TO authenticated;
GRANT SELECT, INSERT ON exercise_results_history TO authenticated;
GRANT SELECT, INSERT ON athlete_workouts_history TO authenticated;

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('workout_history', 'exercise_results_history', 'athlete_workouts_history')
ORDER BY tablename, policyname; 