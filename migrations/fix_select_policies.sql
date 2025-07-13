-- Fix SELECT policies for unified_workout_assignments
-- The UPDATE policies are working, but SELECT policies need improvement

-- First, let's check what's in the profiles table structure
-- Drop and recreate SELECT policies with more comprehensive access patterns

DROP POLICY IF EXISTS "Athletes can view their own unified assignments" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can view assignments for their athletes" ON public.unified_workout_assignments;

-- Create more permissive SELECT policies for debugging
-- Athletes can view their own assignments
CREATE POLICY "Athletes can view their own unified assignments" ON public.unified_workout_assignments
    FOR SELECT
    USING (athlete_id = auth.uid());

-- Coaches can view assignments for their athletes (with multiple join paths)
CREATE POLICY "Coaches can view assignments for their athletes" ON public.unified_workout_assignments
    FOR SELECT
    USING (
        -- Direct coach assignment
        assigned_by = auth.uid()
        OR
        -- Coach-athlete relationship through coach_athletes table
        EXISTS (
            SELECT 1 FROM public.coach_athletes ca
            WHERE ca.coach_id = auth.uid() 
            AND ca.athlete_id = unified_workout_assignments.athlete_id
            AND ca.status = 'active'
        )
        OR
        -- Coach-athlete relationship through profiles table
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = unified_workout_assignments.athlete_id
            AND p.coach_id = auth.uid()
        )
        OR
        -- Team managers can view all assignments in their organization
        EXISTS (
            SELECT 1 FROM public.profiles coach_profile
            JOIN public.profiles athlete_profile ON athlete_profile.id = unified_workout_assignments.athlete_id
            WHERE coach_profile.id = auth.uid()
            AND coach_profile.role = 'team_manager'
            AND (
                coach_profile.organization_id = athlete_profile.organization_id
                OR coach_profile.institution_id = athlete_profile.institution_id
            )
        )
    );

-- Add a temporary very permissive policy for debugging (REMOVE THIS LATER)
CREATE POLICY "DEBUG: Temporary permissive access" ON public.unified_workout_assignments
    FOR SELECT
    USING (true);

-- Verify the policies were created
DO $$
BEGIN
    RAISE NOTICE 'SELECT policies for unified_workout_assignments have been updated';
END $$; 