-- Add soft delete functionality to unified_workout_assignments table
-- This migration adds deleted_at and deleted_by columns to support soft deletes

-- Add deleted_at column (timestamp with timezone)
ALTER TABLE public.unified_workout_assignments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_by column (UUID, references profiles table)
ALTER TABLE public.unified_workout_assignments 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

-- Create index on deleted_at for efficient querying of soft-deleted items
CREATE INDEX IF NOT EXISTS idx_unified_workout_assignments_deleted_at 
ON public.unified_workout_assignments(deleted_at);

-- Create index on deleted_by for efficient querying by who deleted
CREATE INDEX IF NOT EXISTS idx_unified_workout_assignments_deleted_by 
ON public.unified_workout_assignments(deleted_by);

-- Create history table for permanently deleted assignments
CREATE TABLE IF NOT EXISTS public.unified_workout_assignments_history (
  -- Copy all columns from the main table
  id UUID PRIMARY KEY,
  athlete_id UUID NOT NULL,
  assignment_type TEXT NOT NULL,
  exercise_block JSONB NOT NULL,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  start_date TEXT NOT NULL,
  end_date TEXT,
  assigned_at TEXT NOT NULL,
  assigned_by UUID,
  status TEXT NOT NULL DEFAULT 'assigned',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Additional history-specific columns
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID,
  archive_reason TEXT DEFAULT 'permanent_delete'
);

-- Create indexes on history table
CREATE INDEX IF NOT EXISTS idx_unified_workout_assignments_history_athlete_id 
ON public.unified_workout_assignments_history(athlete_id);

CREATE INDEX IF NOT EXISTS idx_unified_workout_assignments_history_archived_at 
ON public.unified_workout_assignments_history(archived_at);

CREATE INDEX IF NOT EXISTS idx_unified_workout_assignments_history_archived_by 
ON public.unified_workout_assignments_history(archived_by);

-- Add RLS policies for history table
ALTER TABLE public.unified_workout_assignments_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own archived assignments
CREATE POLICY "Users can view their own archived assignments" ON public.unified_workout_assignments_history
  FOR SELECT USING (auth.uid() = athlete_id);

-- Policy to allow coaches to view archived assignments of their athletes
CREATE POLICY "Coaches can view archived assignments of their athletes" ON public.unified_workout_assignments_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = athlete_id 
      AND coach_id = auth.uid()
    )
  );

-- Policy to allow admins to view all archived assignments
CREATE POLICY "Admins can view all archived assignments" ON public.unified_workout_assignments_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  ); 