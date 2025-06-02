-- SAFE Fix for athlete_workouts RLS policies and missing columns
-- This handles existing policies by dropping ALL possible variations first

-- Add missing columns to athlete_workouts table if they don't exist
ALTER TABLE public.athlete_workouts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS completed_exercises JSONB DEFAULT '[]'::jsonb;

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_athlete_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_athlete_workouts_updated_at ON public.athlete_workouts;
CREATE TRIGGER trigger_update_athlete_workouts_updated_at
    BEFORE UPDATE ON public.athlete_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_workouts_updated_at();

-- Ensure RLS is enabled on athlete_workouts table
ALTER TABLE public.athlete_workouts ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies to avoid conflicts (comprehensive list)
DROP POLICY IF EXISTS "Users can view athlete workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Athletes can view their own workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Coaches can view their athletes workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Athletes can be assigned workouts" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Coaches can assign workouts to their athletes" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Athletes can assign workouts to themselves" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Users can update their own workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Athletes can update their own workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Coaches can update their athletes workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Athletes can delete their own workout assignments" ON public.athlete_workouts;
DROP POLICY IF EXISTS "Coaches can delete their athletes workout assignments" ON public.athlete_workouts;

-- Also try common variations that might exist
DROP POLICY IF EXISTS "athlete_workouts_select_own" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_insert_own" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_update_own" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_delete_own" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_select_coach" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_insert_coach" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_update_coach" ON public.athlete_workouts;
DROP POLICY IF EXISTS "athlete_workouts_delete_coach" ON public.athlete_workouts;

-- Wait a moment for drops to complete
SELECT pg_sleep(1);

-- Now create the policies fresh

-- READ POLICIES
CREATE POLICY "athlete_workouts_select_own"
  ON public.athlete_workouts
  FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "athlete_workouts_select_coach"
  ON public.athlete_workouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_workouts.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- INSERT POLICIES
CREATE POLICY "athlete_workouts_insert_own"
  ON public.athlete_workouts
  FOR INSERT
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "athlete_workouts_insert_coach"
  ON public.athlete_workouts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_workouts.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- UPDATE POLICIES
CREATE POLICY "athlete_workouts_update_own"
  ON public.athlete_workouts
  FOR UPDATE
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "athlete_workouts_update_coach"
  ON public.athlete_workouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_workouts.athlete_id
      AND ca.approval_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_workouts.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- DELETE POLICIES
CREATE POLICY "athlete_workouts_delete_own"
  ON public.athlete_workouts
  FOR DELETE
  USING (athlete_id = auth.uid());

CREATE POLICY "athlete_workouts_delete_coach"
  ON public.athlete_workouts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.coach_id = auth.uid() 
      AND ca.athlete_id = athlete_workouts.athlete_id
      AND ca.approval_status = 'approved'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_athlete_id ON public.athlete_workouts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_workout_id ON public.athlete_workouts(workout_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_status ON public.athlete_workouts(status);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_assigned_at ON public.athlete_workouts(assigned_at);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_updated_at ON public.athlete_workouts(updated_at); 