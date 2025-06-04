-- Add draft support to workouts table
-- This allows saving workout progress without finalizing them

-- Add is_draft column to workouts table
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on draft workouts
CREATE INDEX IF NOT EXISTS idx_workouts_is_draft_user ON public.workouts(user_id, is_draft) WHERE is_draft = true;

-- Update RLS policies to handle drafts
-- Allow users to view their own drafts
CREATE POLICY IF NOT EXISTS "Users can view their own drafts"
ON public.workouts FOR SELECT
USING (auth.uid() = user_id AND is_draft = true);

-- Allow users to update their own drafts
CREATE POLICY IF NOT EXISTS "Users can update their own drafts"
ON public.workouts FOR UPDATE
USING (auth.uid() = user_id AND is_draft = true);

-- Allow users to delete their own drafts
CREATE POLICY IF NOT EXISTS "Users can delete their own drafts"
ON public.workouts FOR DELETE
USING (auth.uid() = user_id AND is_draft = true);

-- Comment for documentation
COMMENT ON COLUMN public.workouts.is_draft IS 'Indicates if this workout is a draft (not finalized)'; 