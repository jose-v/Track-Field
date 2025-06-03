-- Fix athlete_meet_events RLS policies to work with the profiles table structure
-- The current policies reference athletes and coaches tables but we use profiles

-- Ensure RLS is enabled
ALTER TABLE public.athlete_meet_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that may be causing issues
DROP POLICY IF EXISTS "athlete_meet_events_select_all" ON public.athlete_meet_events;
DROP POLICY IF EXISTS "athlete_meet_events_insert_coach" ON public.athlete_meet_events;
DROP POLICY IF EXISTS "athlete_meet_events_update_coach" ON public.athlete_meet_events;
DROP POLICY IF EXISTS "athlete_meet_events_delete_coach" ON public.athlete_meet_events;
DROP POLICY IF EXISTS "athlete_meet_events_insert_athlete" ON public.athlete_meet_events;

-- SELECT POLICIES
-- Athletes can view their own assignments
CREATE POLICY "athlete_meet_events_select_own"
  ON public.athlete_meet_events
  FOR SELECT
  USING (athlete_id = auth.uid());

-- Coaches can view assignments for their athletes
CREATE POLICY "athlete_meet_events_select_coach"
  ON public.athlete_meet_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_meet_events.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- Anyone can view assignments (for public meet visibility)
CREATE POLICY "athlete_meet_events_select_public"
  ON public.athlete_meet_events
  FOR SELECT
  USING (true);

-- INSERT POLICIES  
-- Coaches can assign athletes to events
CREATE POLICY "athlete_meet_events_insert_coach"
  ON public.athlete_meet_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'coach'
    ) AND
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_meet_events.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- Athletes can assign themselves to events
CREATE POLICY "athlete_meet_events_insert_athlete"
  ON public.athlete_meet_events
  FOR INSERT
  WITH CHECK (
    athlete_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'athlete'
    )
  );

-- UPDATE POLICIES
-- Athletes can update their own assignments (like adding results)
CREATE POLICY "athlete_meet_events_update_own"
  ON public.athlete_meet_events
  FOR UPDATE
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- Coaches can update assignments for their athletes
CREATE POLICY "athlete_meet_events_update_coach"
  ON public.athlete_meet_events
  FOR UPDATE
  USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_meet_events.athlete_id
      AND ca.approval_status = 'approved'
    )
  )
  WITH CHECK (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_meet_events.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- DELETE POLICIES
-- Athletes can remove themselves from events
CREATE POLICY "athlete_meet_events_delete_own"
  ON public.athlete_meet_events
  FOR DELETE
  USING (athlete_id = auth.uid());

-- Coaches can remove assignments for their athletes
CREATE POLICY "athlete_meet_events_delete_coach"
  ON public.athlete_meet_events
  FOR DELETE
  USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_meet_events.athlete_id
      AND ca.approval_status = 'approved'
    )
  ); 