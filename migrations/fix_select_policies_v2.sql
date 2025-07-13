-- Fix SELECT policies for unified_workout_assignments (Version 2)
-- Simplified version that works with actual database structure

-- Drop existing policies
DROP POLICY IF EXISTS "Athletes can view their own unified assignments" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can view assignments for their athletes" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "DEBUG: Temporary permissive access" ON public.unified_workout_assignments;

-- Create simplified SELECT policies that work with your actual schema
-- Athletes can view their own assignments
CREATE POLICY "Athletes can view their own unified assignments" ON public.unified_workout_assignments
    FOR SELECT
    USING (athlete_id = auth.uid());

-- Coaches can view assignments they created or for their athletes
CREATE POLICY "Coaches can view assignments for their athletes" ON public.unified_workout_assignments
    FOR SELECT
    USING (
        -- Direct coach assignment (coach assigned the workout)
        assigned_by = auth.uid()
        OR
        -- Coach-athlete relationship through coach_athletes table (no status check)
        EXISTS (
            SELECT 1 FROM public.coach_athletes ca
            WHERE ca.coach_id = auth.uid() 
            AND ca.athlete_id = unified_workout_assignments.athlete_id
        )
        OR
        -- Coach-athlete relationship through profiles table
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = unified_workout_assignments.athlete_id
            AND p.coach_id = auth.uid()
        )
    );

-- Add a temporary very permissive policy for debugging (REMOVE THIS LATER)
CREATE POLICY "DEBUG: Temporary permissive access" ON public.unified_workout_assignments
    FOR SELECT
    USING (true);

-- Verify the policies were created
DO $$
BEGIN
    RAISE NOTICE 'SELECT policies for unified_workout_assignments have been updated (v2)';
END $$; 