-- Create Athlete Sleep Table
CREATE TABLE IF NOT EXISTS public.athlete_sleep (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  weekly_total DECIMAL(5,2) NOT NULL,
  weekly_average DECIMAL(4,2) NOT NULL,
  quality TEXT NOT NULL, -- 'Poor', 'Fair', 'Good', 'Excellent'
  comparison_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_sleep_athlete_id ON public.athlete_sleep(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_sleep_recorded_at ON public.athlete_sleep(recorded_at);

-- Create RLS policies for athlete_sleep
ALTER TABLE public.athlete_sleep ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Athletes can view their own sleep data" ON public.athlete_sleep;
DROP POLICY IF EXISTS "Athletes can insert their own sleep data" ON public.athlete_sleep;
DROP POLICY IF EXISTS "Coaches can view their athletes' sleep data" ON public.athlete_sleep;

-- Athletes can view their own sleep data
CREATE POLICY "Athletes can view their own sleep data"
  ON public.athlete_sleep
  FOR SELECT
  USING (auth.uid() = athlete_id);

-- Athletes can insert their own sleep data
CREATE POLICY "Athletes can insert their own sleep data"
  ON public.athlete_sleep
  FOR INSERT
  WITH CHECK (auth.uid() = athlete_id);

-- Coaches can view their athletes' sleep data (those who have approved the coach)
CREATE POLICY "Coaches can view their athletes' sleep data"
  ON public.athlete_sleep
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = athlete_sleep.athlete_id
      AND coach_athletes.approval_status = 'approved'
    )
  );

-- Insert sample data for testing if the table is empty
INSERT INTO public.athlete_sleep (athlete_id, weekly_total, weekly_average, quality, comparison_note)
SELECT 
  p.id, 
  49.5, -- weekly total in hours
  7.1, -- weekly average in hours
  'Good', -- quality
  'That''s 30 minutes more per night than your monthly average.' -- comparison note
FROM 
  public.profiles p
WHERE 
  p.role = 'athlete'
  AND NOT EXISTS (SELECT 1 FROM public.athlete_sleep WHERE athlete_id = p.id)
LIMIT 10; 