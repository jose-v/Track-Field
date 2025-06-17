-- Create Training Load Entries Table
-- This table stores RPE and training load data for injury risk analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create training_load_entries table
CREATE TABLE IF NOT EXISTS public.training_load_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rpe INTEGER NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  training_load INTEGER NOT NULL, -- Calculated as rpe * duration_minutes
  workout_type TEXT DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_load_entries_athlete_id ON public.training_load_entries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_load_entries_date ON public.training_load_entries(date);
CREATE INDEX IF NOT EXISTS idx_training_load_entries_athlete_date ON public.training_load_entries(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_training_load_entries_workout_id ON public.training_load_entries(workout_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.training_load_entries ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own training load entries
CREATE POLICY "Athletes can view their own training load entries" ON public.training_load_entries
FOR SELECT USING (auth.uid() = athlete_id);

-- Athletes can insert their own training load entries
CREATE POLICY "Athletes can insert their own training load entries" ON public.training_load_entries
FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- Athletes can update their own training load entries
CREATE POLICY "Athletes can update their own training load entries" ON public.training_load_entries
FOR UPDATE USING (auth.uid() = athlete_id);

-- Coaches can view training load entries for their athletes
CREATE POLICY "Coaches can view their athletes training load entries" ON public.training_load_entries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() 
    AND ca.athlete_id = training_load_entries.athlete_id
    AND ca.approval_status = 'approved'
  )
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_load_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_training_load_entries_updated_at
  BEFORE UPDATE ON public.training_load_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_training_load_entries_updated_at(); 