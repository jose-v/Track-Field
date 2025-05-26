-- Drop any conflicting policies
DROP POLICY IF EXISTS "Coaches can insert coach-athlete relationships" ON public.coach_athletes;
DROP POLICY IF EXISTS "Athletes can insert coach-athlete relationships" ON public.coach_athletes;
DROP POLICY IF EXISTS "Users can update their own coach-athlete relationships" ON public.coach_athletes;

-- Ensure RLS is enabled
ALTER TABLE public.coach_athletes ENABLE ROW LEVEL SECURITY;

-- Coaches can insert new coach-athlete relationships (to send requests)
CREATE POLICY "Coaches can insert coach-athlete relationships"
  ON public.coach_athletes
  FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id
  );

-- Athletes can insert coach-athlete relationships (when responding to requests)
CREATE POLICY "Athletes can insert coach-athlete relationships"
  ON public.coach_athletes
  FOR INSERT
  WITH CHECK (
    auth.uid() = athlete_id
  );

-- Allow users to update relationships where they're either the coach or athlete
CREATE POLICY "Users can update their own coach-athlete relationships"
  ON public.coach_athletes
  FOR UPDATE
  USING (
    auth.uid() = coach_id OR auth.uid() = athlete_id
  )
  WITH CHECK (
    auth.uid() = coach_id OR auth.uid() = athlete_id
  );

-- Anyone involved in the relationship can view it
CREATE POLICY "Users can view their own coach-athlete relationships"
  ON public.coach_athletes
  FOR SELECT
  USING (
    auth.uid() = coach_id OR auth.uid() = athlete_id
  ); 