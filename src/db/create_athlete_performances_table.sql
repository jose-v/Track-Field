-- Create Athlete Performances Table
CREATE TABLE IF NOT EXISTS public.athlete_performances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  best_time TEXT NOT NULL,
  improvement TEXT NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_performances_athlete_id ON public.athlete_performances(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_performances_recorded_at ON public.athlete_performances(recorded_at);

-- Create RLS policies for athlete_performances
ALTER TABLE public.athlete_performances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Athletes can view their own performances" ON public.athlete_performances;
DROP POLICY IF EXISTS "Athletes can insert their own performances" ON public.athlete_performances;
DROP POLICY IF EXISTS "Coaches can view their athletes' performances" ON public.athlete_performances;

-- Athletes can view their own performances
CREATE POLICY "Athletes can view their own performances"
  ON public.athlete_performances
  FOR SELECT
  USING (auth.uid() = athlete_id);

-- Athletes can insert their own performances
CREATE POLICY "Athletes can insert their own performances"
  ON public.athlete_performances
  FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);

-- Coaches can view their athletes' performances (those who have approved the coach)
CREATE POLICY "Coaches can view their athletes' performances"
  ON public.athlete_performances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = athlete_performances.athlete_id
      AND coach_athletes.approval_status = 'approved'
    )
  );

-- Insert sample data for testing if the table is empty
INSERT INTO public.athlete_performances (athlete_id, event, best_time, improvement, notes)
SELECT 
  p.id, 
  '100m', 
  '11.3s', 
  '0.2s',
  'This puts you in the top 10% of your age group.'
FROM 
  public.profiles p
WHERE 
  p.role = 'athlete'
  AND NOT EXISTS (SELECT 1 FROM public.athlete_performances WHERE athlete_id = p.id)
LIMIT 10; 