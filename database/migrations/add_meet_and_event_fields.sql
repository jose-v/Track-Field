-- Migration: Add new fields to track_meets and meet_events tables
-- Date: $(date)

-- Add new columns to track_meets table
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS venue_type TEXT CHECK (venue_type IN ('Indoor', 'Outdoor')),
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS join_link TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add new columns to meet_events table  
ALTER TABLE meet_events
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS heat INTEGER,
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('Preliminary', 'Qualifier', 'Semifinal', 'Finals')),
ADD COLUMN IF NOT EXISTS run_time TEXT;

-- Add comments for documentation
COMMENT ON COLUMN track_meets.end_date IS 'End date for multi-day meets (optional)';
COMMENT ON COLUMN track_meets.venue_type IS 'Indoor or Outdoor venue type';
COMMENT ON COLUMN track_meets.venue_name IS 'Name of the stadium or venue';
COMMENT ON COLUMN track_meets.join_link IS 'Optional registration or information link';
COMMENT ON COLUMN track_meets.description IS 'Additional details and description about the meet';

COMMENT ON COLUMN meet_events.event_date IS 'Specific date for this event (useful for multi-day meets)';
COMMENT ON COLUMN meet_events.heat IS 'Heat number for the event';
COMMENT ON COLUMN meet_events.event_type IS 'Type of event: Preliminary, Qualifier, Semifinal, or Finals';
COMMENT ON COLUMN meet_events.run_time IS 'Actual run time result (to be filled post-event)';

-- Create index for better performance on new date field
CREATE INDEX IF NOT EXISTS idx_track_meets_end_date ON track_meets(end_date);
CREATE INDEX IF NOT EXISTS idx_meet_events_event_date ON meet_events(event_date);
CREATE INDEX IF NOT EXISTS idx_meet_events_heat ON meet_events(heat);
CREATE INDEX IF NOT EXISTS idx_meet_events_event_type ON meet_events(event_type); 