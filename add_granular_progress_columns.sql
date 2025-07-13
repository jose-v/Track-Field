-- Migration: Add granular progress tracking columns
-- This allows saving current exercise index, set, and rep during workout execution
-- so users can resume exactly where they left off even after page refresh

-- Add columns to athlete_workouts table for regular workouts
ALTER TABLE athlete_workouts 
ADD COLUMN IF NOT EXISTS current_exercise_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_set INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_rep INTEGER DEFAULT 1;

-- Add columns to training_plan_assignments table for monthly plan workouts  
ALTER TABLE training_plan_assignments
ADD COLUMN IF NOT EXISTS current_exercise_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_set INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_rep INTEGER DEFAULT 1;

-- Add comments to document the purpose
COMMENT ON COLUMN athlete_workouts.current_exercise_index IS 'Current exercise index (0-based) for granular progress tracking during workout execution';
COMMENT ON COLUMN athlete_workouts.current_set IS 'Current set number (1-based) within the current exercise';
COMMENT ON COLUMN athlete_workouts.current_rep IS 'Current rep number (1-based) within the current set';

COMMENT ON COLUMN training_plan_assignments.current_exercise_index IS 'Current exercise index (0-based) for granular progress tracking during monthly plan workout execution';
COMMENT ON COLUMN training_plan_assignments.current_set IS 'Current set number (1-based) within the current exercise';
COMMENT ON COLUMN training_plan_assignments.current_rep IS 'Current rep number (1-based) within the current set'; 