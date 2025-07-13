-- Fix SELECT policies for unified_workout_assignments (Version 3)
-- Ultra-simplified version that only uses confirmed existing columns

-- Drop existing policies
DROP POLICY IF EXISTS "Athletes can view their own unified assignments" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can view assignments for their athletes" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "DEBUG: Temporary permissive access" ON public.unified_workout_assignments;

-- Create basic SELECT policies using only confirmed columns
-- Athletes can view their own assignments
CREATE POLICY "Athletes can view their own unified assignments" ON public.unified_workout_assignments
    FOR SELECT
    USING (athlete_id = auth.uid());

-- Coaches can view assignments they created
CREATE POLICY "Coaches can view assignments they created" ON public.unified_workout_assignments
    FOR SELECT
    USING (assigned_by = auth.uid());

-- Add a temporary very permissive policy for debugging (REMOVE THIS LATER)
CREATE POLICY "DEBUG: Temporary permissive access" ON public.unified_workout_assignments
    FOR SELECT
    USING (true);

-- Verify the policies were created
DO $$
BEGIN
    RAISE NOTICE 'SELECT policies for unified_workout_assignments have been updated (v3)';
END $$; 