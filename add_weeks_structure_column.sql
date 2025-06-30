-- Add weeks_structure column to training_plans table
-- This column will store the complete week structure preserving rest weeks and exact week positions
-- Format: JSON array where each index corresponds to week number (0-indexed)
-- null values indicate rest weeks, string values are workout IDs

ALTER TABLE public.training_plans 
ADD COLUMN IF NOT EXISTS weeks_structure JSONB;

-- Add a comment to explain the column
COMMENT ON COLUMN public.training_plans.weeks_structure IS 'Structured week data where array index = week_number - 1, null = rest week, string = workout_id';

-- Create an index for performance on the new column
CREATE INDEX IF NOT EXISTS idx_training_plans_weeks_structure ON public.training_plans USING GIN (weeks_structure);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'training_plans' 
  AND table_schema = 'public' 
  AND column_name = 'weeks_structure'; 