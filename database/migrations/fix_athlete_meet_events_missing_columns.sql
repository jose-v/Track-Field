-- Migration: Add missing columns to athlete_meet_events table
-- This fixes the "column athlete_meet_events.result does not exist" error
-- Date: 2024-01-xx

-- Current table has: id, athlete_id, meet_event_id, assigned_by, created_at, updated_at
-- Adding missing columns that the application code expects

-- Add missing columns to athlete_meet_events table
ALTER TABLE public.athlete_meet_events 
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'withdrawn', 'completed')),
ADD COLUMN IF NOT EXISTS result TEXT,
ADD COLUMN IF NOT EXISTS place INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.athlete_meet_events.result IS 'Final result/time for the athlete in this event';
COMMENT ON COLUMN public.athlete_meet_events.place IS 'Finishing place in the event';
COMMENT ON COLUMN public.athlete_meet_events.status IS 'Registration status: registered, withdrawn, or completed';
COMMENT ON COLUMN public.athlete_meet_events.registered_at IS 'When the athlete was registered for this event';
COMMENT ON COLUMN public.athlete_meet_events.notes IS 'Additional notes about the athlete participation';

-- Create indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_athlete_meet_events_status ON public.athlete_meet_events(status);
CREATE INDEX IF NOT EXISTS idx_athlete_meet_events_place ON public.athlete_meet_events(place);

-- Update existing records to have a proper registered_at timestamp based on created_at
UPDATE public.athlete_meet_events 
SET registered_at = created_at 
WHERE registered_at IS NULL; 