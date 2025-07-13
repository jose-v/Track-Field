-- Fix RLS policies for unified_workout_assignments table
-- This ensures users can properly read/write their assignment data

-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.unified_workout_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Athletes can view their own unified assignments" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can view assignments for their athletes" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Athletes can update their own unified assignment progress" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can update assignments for their athletes" ON public.unified_workout_assignments;
DROP POLICY IF EXISTS "Coaches can assign workouts to their athletes" ON public.unified_workout_assignments;

-- Create new policies

-- Athletes can view their own assignments
CREATE POLICY "Athletes can view their own unified assignments"
ON public.unified_workout_assignments FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches can view assignments for their athletes
CREATE POLICY "Coaches can view assignments for their athletes"
ON public.unified_workout_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = unified_workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Athletes can update their own assignment progress
CREATE POLICY "Athletes can update their own unified assignment progress"
ON public.unified_workout_assignments FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Coaches can update assignments for their athletes
CREATE POLICY "Coaches can update assignments for their athletes"
ON public.unified_workout_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = unified_workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Coaches can create assignments for their athletes
CREATE POLICY "Coaches can assign workouts to their athletes"
ON public.unified_workout_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = unified_workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Also add DELETE policy for coaches
CREATE POLICY "Coaches can delete assignments for their athletes"
ON public.unified_workout_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = unified_workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Verify the policies were created
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for unified_workout_assignments have been updated successfully';
END $$; 