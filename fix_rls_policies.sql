-- Fix RLS policies for workouts table to only reference user_id field
-- Drop existing policies that reference the old created_by field

DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;

-- Recreate policies with correct field reference
CREATE POLICY "Users can create their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'workouts' 
ORDER BY policyname; 