-- Migration: Create unified workout_assignments table
-- This creates a new unified assignment system that will run in parallel with existing tables
-- DO NOT DROP existing tables - this is for gradual migration

-- ====================================
-- STEP 1: Create the unified workout_assignments table
-- ====================================

CREATE TABLE IF NOT EXISTS public.workout_assignments (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Assignment Classification
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('single', 'weekly', 'monthly')),
  
  -- Workout Data Storage (JSONB for flexibility)
  exercise_block JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Universal Progress Tracking (JSONB for all workout types)  
  progress JSONB NOT NULL DEFAULT '{
    "current_exercise_index": 0,
    "current_set": 1,
    "current_rep": 1,
    "completed_exercises": [],
    "started_at": null,
    "completed_at": null,
    "total_exercises": 0,
    "completion_percentage": 0
  }'::jsonb,
  
  -- Scheduling & Assignment Info
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL, -- For weekly/monthly ranges
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Assignment Status
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  
  -- Type-Specific Metadata (JSONB for flexibility)
  meta JSONB DEFAULT '{}'::jsonb,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate assignments
  UNIQUE(athlete_id, assignment_type, start_date)
);

-- ====================================
-- STEP 2: Create performance indexes
-- ====================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_workout_assignments_athlete_type 
ON public.workout_assignments(athlete_id, assignment_type);

CREATE INDEX IF NOT EXISTS idx_workout_assignments_athlete_status 
ON public.workout_assignments(athlete_id, status);

CREATE INDEX IF NOT EXISTS idx_workout_assignments_date_range 
ON public.workout_assignments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_workout_assignments_assigned_by 
ON public.workout_assignments(assigned_by);

-- JSONB indexes for progress queries
CREATE INDEX IF NOT EXISTS idx_workout_assignments_progress_gin 
ON public.workout_assignments USING GIN (progress);

CREATE INDEX IF NOT EXISTS idx_workout_assignments_meta_gin 
ON public.workout_assignments USING GIN (meta);

-- ====================================
-- STEP 3: Enable Row Level Security (RLS)
-- ====================================

ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own assignments
CREATE POLICY "Athletes can view their own workout assignments"
ON public.workout_assignments FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches can view assignments for their athletes
CREATE POLICY "Coaches can view assignments for their athletes"
ON public.workout_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Coaches can create assignments for their athletes
CREATE POLICY "Coaches can assign workouts to their athletes"
ON public.workout_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- Athletes can update their own assignment progress
CREATE POLICY "Athletes can update their own assignment progress"
ON public.workout_assignments FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Coaches can update assignments for their athletes
CREATE POLICY "Coaches can update assignments for their athletes"
ON public.workout_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.athlete_id = workout_assignments.athlete_id 
    AND ca.coach_id = auth.uid()
    AND ca.approval_status = 'approved'
  )
);

-- ====================================
-- STEP 4: Create updated_at trigger
-- ====================================

CREATE OR REPLACE FUNCTION update_workout_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workout_assignments_updated_at
  BEFORE UPDATE ON public.workout_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_assignments_updated_at();

-- ====================================
-- STEP 5: Add helpful comments
-- ====================================

COMMENT ON TABLE public.workout_assignments IS 'Unified assignment system for all workout types (single, weekly, monthly)';
COMMENT ON COLUMN public.workout_assignments.exercise_block IS 'JSONB storage for workout exercises - adapts to different workout structures';
COMMENT ON COLUMN public.workout_assignments.progress IS 'JSONB progress tracking - universal for all assignment types';
COMMENT ON COLUMN public.workout_assignments.meta IS 'JSONB metadata for type-specific information (EMOM intervals, AMRAP rounds, etc.)';
COMMENT ON COLUMN public.workout_assignments.assignment_type IS 'Type of assignment: single (one workout), weekly (week plan), monthly (month plan)';

-- ====================================
-- VERIFICATION
-- ====================================

-- Verify table was created successfully
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_assignments') THEN
    RAISE NOTICE 'SUCCESS: workout_assignments table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: workout_assignments table was not created';
  END IF;
END $$; 