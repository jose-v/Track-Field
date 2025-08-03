-- Fix exercise_results_history table by adding missing exercise_id column
-- This column is needed for the archive function to work properly

-- Add exercise_id column to exercise_results_history
ALTER TABLE exercise_results_history 
ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL;

-- Add index for exercise_id column
CREATE INDEX IF NOT EXISTS idx_exercise_results_history_exercise_id ON exercise_results_history(exercise_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercise_results_history' 
AND column_name = 'exercise_id'; 