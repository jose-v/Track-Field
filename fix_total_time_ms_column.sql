-- Fix exercise_results_history table by adding missing total_time_ms column
-- This column is needed for the archive function to work properly

-- Add total_time_ms column to exercise_results_history
ALTER TABLE exercise_results_history 
ADD COLUMN IF NOT EXISTS total_time_ms INTEGER;

-- Add index for total_time_ms column
CREATE INDEX IF NOT EXISTS idx_exercise_results_history_total_time_ms ON exercise_results_history(total_time_ms);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercise_results_history' 
AND column_name = 'total_time_ms'; 