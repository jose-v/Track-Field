-- Create Athlete Meets Table
CREATE TABLE IF NOT EXISTS public.athlete_meets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  start_time TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_meets_athlete_id ON public.athlete_meets(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_meets_date ON public.athlete_meets(date);

-- Create RLS policies for athlete_meets
ALTER TABLE public.athlete_meets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Athletes can view their own meets" ON public.athlete_meets;
DROP POLICY IF EXISTS "Athletes can insert their own meets" ON public.athlete_meets;
DROP POLICY IF EXISTS "Coaches can view their athletes' meets" ON public.athlete_meets;

-- Athletes can view their own meets
CREATE POLICY "Athletes can view their own meets"
  ON public.athlete_meets
  FOR SELECT
  USING (auth.uid() = athlete_id);

-- Athletes can insert their own meets
CREATE POLICY "Athletes can insert their own meets"
  ON public.athlete_meets
  FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);

-- Coaches can view their athletes' meets (those who have approved the coach)
CREATE POLICY "Coaches can view their athletes' meets"
  ON public.athlete_meets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = athlete_meets.athlete_id
      AND coach_athletes.approval_status = 'approved'
    )
  );

-- Insert sample data for testing if the table is empty
INSERT INTO public.athlete_meets (athlete_id, name, date, location, start_time, notes)
SELECT 
  p.id, 
  'Carter Invitational', 
  '2025-12-11', 
  'Greensboro, NC', 
  '10:00 AM',
  'Important qualifying event for regionals'
FROM 
  public.profiles p
WHERE 
  p.role = 'athlete'
  AND NOT EXISTS (SELECT 1 FROM public.athlete_meets WHERE athlete_id = p.id)
LIMIT 10; 