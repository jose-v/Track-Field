-- Fix exercise_results_history table by adding missing completed_at column
-- This column is needed for the analytics view to work properly

-- Add completed_at column to exercise_results_history
ALTER TABLE exercise_results_history 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for completed_at column
CREATE INDEX IF NOT EXISTS idx_exercise_results_history_completed_at ON exercise_results_history(completed_at);

-- Update existing records to have a completed_at value if it's NULL
UPDATE exercise_results_history 
SET completed_at = created_at 
WHERE completed_at IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercise_results_history' 
AND column_name = 'completed_at'; 