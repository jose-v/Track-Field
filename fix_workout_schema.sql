-- Fix missing is_template column in workouts table
-- This field is required for the workout creation functionality to work

ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'workouts' 
  AND table_schema = 'public' 
  AND column_name = 'is_template'; 