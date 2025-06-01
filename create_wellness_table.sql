-- Create Athlete Wellness Surveys Table
-- This table stores daily wellness check-ins for athletes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create athlete_wellness_surveys table
CREATE TABLE IF NOT EXISTS public.athlete_wellness_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  survey_date DATE NOT NULL,
  
  -- Core wellness metrics (1-10 scale)
  fatigue_level INTEGER NOT NULL CHECK (fatigue_level >= 1 AND fatigue_level <= 10),
  muscle_soreness INTEGER NOT NULL CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
  motivation_level INTEGER NOT NULL CHECK (motivation_level >= 1 AND motivation_level <= 10),
  overall_feeling INTEGER NOT NULL CHECK (overall_feeling >= 1 AND overall_feeling <= 10),
  
  -- Optional sleep metrics
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_duration NUMERIC(4,2) CHECK (sleep_duration >= 0 AND sleep_duration <= 24), -- hours
  
  -- Additional data
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one survey per athlete per day
  UNIQUE(athlete_id, survey_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_wellness_surveys_athlete_id ON public.athlete_wellness_surveys(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_wellness_surveys_survey_date ON public.athlete_wellness_surveys(survey_date);
CREATE INDEX IF NOT EXISTS idx_athlete_wellness_surveys_athlete_date ON public.athlete_wellness_surveys(athlete_id, survey_date);

-- Set up Row Level Security (RLS)
ALTER TABLE public.athlete_wellness_surveys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Athletes can view their own wellness surveys" ON public.athlete_wellness_surveys;
DROP POLICY IF EXISTS "Athletes can insert their own wellness surveys" ON public.athlete_wellness_surveys;
DROP POLICY IF EXISTS "Athletes can update their own wellness surveys" ON public.athlete_wellness_surveys;
DROP POLICY IF EXISTS "Coaches can view their athletes wellness surveys" ON public.athlete_wellness_surveys;

-- Policy: Athletes can view their own wellness surveys
CREATE POLICY "Athletes can view their own wellness surveys"
  ON public.athlete_wellness_surveys
  FOR SELECT
  USING (auth.uid() = athlete_id);

-- Policy: Athletes can insert their own wellness surveys
CREATE POLICY "Athletes can insert their own wellness surveys"
  ON public.athlete_wellness_surveys
  FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);

-- Policy: Athletes can update their own wellness surveys
CREATE POLICY "Athletes can update their own wellness surveys"
  ON public.athlete_wellness_surveys
  FOR UPDATE
  USING (auth.uid() = athlete_id);

-- Policy: Coaches can view their athletes' wellness surveys (for approved relationships)
CREATE POLICY "Coaches can view their athletes wellness surveys"
  ON public.athlete_wellness_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = athlete_wellness_surveys.athlete_id
      AND coach_athletes.approval_status = 'approved'
    )
  );

-- Create a view for wellness analytics
CREATE OR REPLACE VIEW public.athlete_wellness_view AS
SELECT 
  aws.*,
  p.first_name,
  p.last_name,
  (p.first_name || ' ' || p.last_name) AS full_name,
  a.team_id,
  -- Calculate overall wellness score
  ROUND(
    ((11 - aws.fatigue_level) * 0.25 + 
     (11 - aws.muscle_soreness) * 0.20 + 
     (11 - aws.stress_level) * 0.20 + 
     aws.motivation_level * 0.15 + 
     aws.overall_feeling * 0.20) * 10
  ) / 10.0 AS wellness_score
FROM public.athlete_wellness_surveys aws
JOIN public.profiles p ON aws.athlete_id = p.id
LEFT JOIN public.athletes a ON aws.athlete_id = a.id
ORDER BY aws.survey_date DESC;

-- Add comment to table
COMMENT ON TABLE public.athlete_wellness_surveys IS 'Daily wellness check-ins for athletes tracking fatigue, stress, motivation, and overall feeling';

-- Add comments to important columns
COMMENT ON COLUMN public.athlete_wellness_surveys.fatigue_level IS 'Fatigue level (1=very low, 10=very high)';
COMMENT ON COLUMN public.athlete_wellness_surveys.muscle_soreness IS 'Muscle soreness (1=none, 10=severe)';
COMMENT ON COLUMN public.athlete_wellness_surveys.stress_level IS 'Stress level (1=very low, 10=very high)';
COMMENT ON COLUMN public.athlete_wellness_surveys.motivation_level IS 'Motivation level (1=very low, 10=very high)';
COMMENT ON COLUMN public.athlete_wellness_surveys.overall_feeling IS 'Overall feeling (1=very poor, 10=excellent)';
COMMENT ON COLUMN public.athlete_wellness_surveys.sleep_duration IS 'Sleep duration in hours (e.g., 7.5 for 7 hours 30 minutes)'; 