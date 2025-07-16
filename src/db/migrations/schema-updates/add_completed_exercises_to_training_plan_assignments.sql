-- Add completed_exercises column to training_plan_assignments table
-- This column will store an array of completed exercise indices for monthly plan progress tracking

ALTER TABLE public.training_plan_assignments 
ADD COLUMN IF NOT EXISTS completed_exercises JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_completed_exercises 
ON public.training_plan_assignments USING GIN (completed_exercises);

-- Add comment to document the column
COMMENT ON COLUMN public.training_plan_assignments.completed_exercises IS 'Array of exercise indices that have been completed for todays workout in the monthly plan';

-- Update any existing records to have empty array (just in case)
UPDATE public.training_plan_assignments 
SET completed_exercises = '[]'::jsonb 
WHERE completed_exercises IS NULL; 