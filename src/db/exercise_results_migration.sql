-- Exercise Results Migration
-- This table stores individual exercise execution results for athletes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exercise_results table
CREATE TABLE IF NOT EXISTS public.exercise_results (
  id                UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id        UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id        UUID      NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_index    INTEGER   NOT NULL,                -- Index of exercise in workout.exercises array
  exercise_name     TEXT      NOT NULL,                -- Name of the exercise for reference
  
  -- Timing data for run exercises (stored as milliseconds for precision)
  time_minutes      INTEGER   DEFAULT NULL,            -- Minutes
  time_seconds      INTEGER   DEFAULT NULL,            -- Seconds 
  time_hundredths   INTEGER   DEFAULT NULL,            -- Hundredths of a second
  total_time_ms     INTEGER   DEFAULT NULL,            -- Total time in milliseconds (calculated)
  
  -- Other exercise data (for future expansion)
  sets_completed    INTEGER   DEFAULT NULL,
  reps_completed    INTEGER   DEFAULT NULL,
  weight_used       NUMERIC   DEFAULT NULL,
  distance_meters   NUMERIC   DEFAULT NULL,
  rpe_rating        INTEGER   DEFAULT NULL,            -- Rate of perceived exertion (1-10)
  
  -- Metadata
  completed_at      TIMESTAMPTZ DEFAULT NOW(),
  notes             TEXT      DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_results_athlete_id ON public.exercise_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_workout_id ON public.exercise_results(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_exercise_name ON public.exercise_results(exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercise_results_completed_at ON public.exercise_results(completed_at);

-- Enable Row Level Security
ALTER TABLE public.exercise_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Athletes can view their own results
CREATE POLICY "Athletes can view their own exercise results"
  ON public.exercise_results
  FOR SELECT
  USING (athlete_id = auth.uid());

-- RLS Policy: Athletes can insert their own results
CREATE POLICY "Athletes can insert their own exercise results"
  ON public.exercise_results
  FOR INSERT
  WITH CHECK (athlete_id = auth.uid());

-- RLS Policy: Athletes can update their own results
CREATE POLICY "Athletes can update their own exercise results"
  ON public.exercise_results
  FOR UPDATE
  USING (athlete_id = auth.uid());

-- RLS Policy: Coaches can view results of their athletes
CREATE POLICY "Coaches can view results of their athletes"
  ON public.exercise_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = exercise_results.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- Function to automatically calculate total_time_ms when time components are provided
CREATE OR REPLACE FUNCTION calculate_total_time_ms()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total time in milliseconds if time components are provided
  IF NEW.time_minutes IS NOT NULL AND NEW.time_seconds IS NOT NULL AND NEW.time_hundredths IS NOT NULL THEN
    NEW.total_time_ms := (NEW.time_minutes * 60 * 1000) + (NEW.time_seconds * 1000) + (NEW.time_hundredths * 10);
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total time
CREATE TRIGGER trigger_calculate_total_time_ms
  BEFORE INSERT OR UPDATE ON public.exercise_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_time_ms();

-- Function to format time for display (returns MM:SS.HH format)
CREATE OR REPLACE FUNCTION format_exercise_time(
  minutes INTEGER,
  seconds INTEGER, 
  hundredths INTEGER
)
RETURNS TEXT AS $$
BEGIN
  IF minutes IS NULL OR seconds IS NULL OR hundredths IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN LPAD(minutes::TEXT, 2, '0') || ':' || 
         LPAD(seconds::TEXT, 2, '0') || '.' || 
         LPAD(hundredths::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql; 