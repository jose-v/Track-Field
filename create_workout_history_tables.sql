-- Create workout history tables to preserve data instead of permanent deletion

-- 1. Create workout_history table
CREATE TABLE IF NOT EXISTS workout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_workout_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  date TEXT,
  time TEXT,
  duration TEXT,
  location TEXT,
  exercises JSONB,
  blocks JSONB,
  is_block_based BOOLEAN DEFAULT FALSE,
  block_version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT FALSE,
  template_type TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES profiles(id),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_by UUID REFERENCES profiles(id) NOT NULL
);

-- 2. Create exercise_results_history table
CREATE TABLE IF NOT EXISTS exercise_results_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_result_id UUID NOT NULL,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  workout_id UUID NOT NULL, -- This will be the original workout ID
  exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  exercise_index INTEGER,
  exercise_name TEXT,
  time_minutes INTEGER,
  time_seconds INTEGER,
  time_hundredths INTEGER,
  total_time_ms INTEGER,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used NUMERIC(10,2),
  distance_meters NUMERIC(10,2),
  rpe_rating INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_by UUID REFERENCES profiles(id) NOT NULL
);

-- 3. Create athlete_workouts_history table
CREATE TABLE IF NOT EXISTS athlete_workouts_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_assignment_id UUID NOT NULL,
  workout_id UUID NOT NULL, -- This will be the original workout ID
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date DATE,
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_by UUID REFERENCES profiles(id) NOT NULL
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_history_original_id ON workout_history(original_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_archived_at ON workout_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_archived_by ON workout_history(archived_by);

CREATE INDEX IF NOT EXISTS idx_exercise_results_history_workout_id ON exercise_results_history(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_history_athlete_id ON exercise_results_history(athlete_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_history_archived_at ON exercise_results_history(archived_at);

CREATE INDEX IF NOT EXISTS idx_athlete_workouts_history_workout_id ON athlete_workouts_history(workout_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_history_athlete_id ON athlete_workouts_history(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_history_archived_at ON athlete_workouts_history(archived_at);

-- 5. Add RLS policies for the history tables
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_results_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_workouts_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own archived workouts
CREATE POLICY "Users can view their own archived workouts"
  ON workout_history FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = archived_by);

-- Allow users to view their own archived exercise results
CREATE POLICY "Users can view their own archived exercise results"
  ON exercise_results_history FOR SELECT
  USING (auth.uid() = archived_by);

-- Allow users to view their own archived assignments
CREATE POLICY "Users can view their own archived assignments"
  ON athlete_workouts_history FOR SELECT
  USING (auth.uid() = archived_by);

-- 6. Create a function to restore archived workouts (for admin use)
CREATE OR REPLACE FUNCTION restore_archived_workout(workout_history_id UUID)
RETURNS UUID AS $$
DECLARE
  restored_workout_id UUID;
  workout_record RECORD;
BEGIN
  -- Get the archived workout data
  SELECT * INTO workout_record FROM workout_history WHERE id = workout_history_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archived workout not found';
  END IF;
  
  -- Insert back into workouts table
  INSERT INTO workouts (
    id,
    name,
    description,
    type,
    date,
    time,
    duration,
    location,
    exercises,
    blocks,
    is_block_based,
    block_version,
    is_template,
    template_type,
    user_id,
    created_by,
    created_at,
    updated_at,
    deleted_at,
    deleted_by
  ) VALUES (
    workout_record.original_workout_id,
    workout_record.name,
    workout_record.description,
    workout_record.type,
    workout_record.date,
    workout_record.time,
    workout_record.duration,
    workout_record.location,
    workout_record.exercises,
    workout_record.blocks,
    workout_record.is_block_based,
    workout_record.block_version,
    workout_record.is_template,
    workout_record.template_type,
    workout_record.user_id,
    workout_record.created_by,
    workout_record.created_at,
    workout_record.updated_at,
    workout_record.deleted_at,
    workout_record.deleted_by
  ) RETURNING id INTO restored_workout_id;
  
  -- Restore exercise results
  INSERT INTO exercise_results (
    athlete_id,
    workout_id,
    exercise_index,
    exercise_name,
    time_minutes,
    time_seconds,
    time_hundredths,
    sets_completed,
    reps_completed,
    weight_used,
    distance_meters,
    rpe_rating,
    notes,
    created_at,
    updated_at
  )
  SELECT 
    athlete_id,
    workout_id,
    exercise_index,
    exercise_name,
    time_minutes,
    time_seconds,
    time_hundredths,
    sets_completed,
    reps_completed,
    weight_used,
    distance_meters,
    rpe_rating,
    notes,
    created_at,
    updated_at
  FROM exercise_results_history 
  WHERE workout_id = workout_record.original_workout_id;
  
  -- Restore assignments
  INSERT INTO athlete_workouts (
    workout_id,
    athlete_id,
    assigned_by,
    assigned_at,
    due_date,
    status
  )
  SELECT 
    workout_id,
    athlete_id,
    assigned_by,
    assigned_at,
    due_date,
    status
  FROM athlete_workouts_history 
  WHERE workout_id = workout_record.original_workout_id;
  
  -- Delete from history tables
  DELETE FROM workout_history WHERE id = workout_history_id;
  DELETE FROM exercise_results_history WHERE workout_id = workout_record.original_workout_id;
  DELETE FROM athlete_workouts_history WHERE workout_id = workout_record.original_workout_id;
  
  RETURN restored_workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add comment explaining the purpose
COMMENT ON TABLE workout_history IS 'Archived workouts preserved for data retention and potential recovery';
COMMENT ON TABLE exercise_results_history IS 'Archived exercise results preserved for data retention and potential recovery';
COMMENT ON TABLE athlete_workouts_history IS 'Archived workout assignments preserved for data retention and potential recovery'; 