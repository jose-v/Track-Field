-- Temporary full access policy for unified_workout_assignments
-- This is for debugging purposes only - REMOVE AFTER TESTING

-- Disable RLS temporarily to test if that's the issue
ALTER TABLE public.unified_workout_assignments DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled but make it fully permissive
-- Uncomment the lines below if you prefer to keep RLS enabled:

-- DROP POLICY IF EXISTS "Athletes can view their own unified assignments" ON public.unified_workout_assignments;
-- DROP POLICY IF EXISTS "Coaches can view assignments they created" ON public.unified_workout_assignments;
-- DROP POLICY IF EXISTS "DEBUG: Temporary permissive access" ON public.unified_workout_assignments;
-- DROP POLICY IF EXISTS "Athletes can update their own unified assignment progress" ON public.unified_workout_assignments;
-- DROP POLICY IF EXISTS "Coaches can update assignments for their athletes" ON public.unified_workout_assignments;

-- CREATE POLICY "Temporary full access" ON public.unified_workout_assignments
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- Verify the change
DO $$
BEGIN
    RAISE NOTICE 'RLS has been temporarily disabled for unified_workout_assignments';
END $$; 