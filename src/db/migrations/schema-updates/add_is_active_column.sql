-- Add is_active column to teams table if it doesn't exist
-- This ensures all existing teams are marked as active by default

-- Add the column
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any existing teams that might have NULL values to true
UPDATE public.teams 
SET is_active = true 
WHERE is_active IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'teams' AND column_name = 'is_active';

-- Show current teams with their is_active status
SELECT id, name, team_type, is_active 
FROM public.teams 
ORDER BY name; 