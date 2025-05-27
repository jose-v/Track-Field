-- track_meets_migration.sql
-- Migration file for track meets and meet events

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table for Track Meets
CREATE TABLE IF NOT EXISTS public.track_meets (
  id                   UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT      NOT NULL,               -- Event name
  address              TEXT,                             -- Full street address
  city                 TEXT,
  state                TEXT,
  zip                  TEXT,
  website              TEXT,                             -- Event website URL
  contact_name         TEXT,                             -- Meet contact person
  contact_email        TEXT,
  contact_phone        TEXT,
  coach_id             UUID      REFERENCES public.coaches(id) ON DELETE SET NULL,
  athlete_id           UUID      REFERENCES public.athletes(id) ON DELETE SET NULL, -- For athlete-created meets
  school               TEXT,                             -- School or "Unattached"
  meet_type            TEXT,                             -- e.g. "Invitational", "Championship"
  sanctioning_body     TEXT,                             -- e.g. "USATF", "NFHS"
  host_organization    TEXT,                             -- Host club or school
  status               TEXT    DEFAULT 'Planned',        -- "Planned", "Completed", "Cancelled"
  registration_deadline DATE,
  entry_fee            NUMERIC,
  meet_date            DATE      NOT NULL,               -- Date of the meet
  arrival_date         DATE,                             -- When the team arrives
  departure_date       DATE,                             -- When the team departs
  transportation_modes TEXT[],                           -- e.g. { 'School Bus', 'Plane' }
  transportation_info  TEXT,                             -- Details (flight#, driver, etc.)
  lodging_type         TEXT,                             -- e.g. "Hotel", "AirBnB", "Other"
  lodging_details      TEXT,                             -- Name/address of lodging
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Individual Events within each Meet
CREATE TABLE IF NOT EXISTS public.meet_events (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  meet_id       UUID      NOT NULL REFERENCES public.track_meets(id) ON DELETE CASCADE,
  event_id      UUID      REFERENCES public.events(id),              -- Reference to standard event type
  event_name    TEXT      NOT NULL,                                  -- e.g. "200m", "400m"
  event_day     INT,                                                 -- Day number within the meet (1, 2, …)
  start_time    TIME,                                                -- When this event begins
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Athlete Meet Event Assignments - which athletes are participating in which events
CREATE TABLE IF NOT EXISTS public.athlete_meet_events (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id    UUID      NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  meet_event_id UUID      NOT NULL REFERENCES public.meet_events(id) ON DELETE CASCADE,
  assigned_by   UUID      REFERENCES public.coaches(id) ON DELETE SET NULL, -- Coach who assigned
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(athlete_id, meet_event_id)                                 -- Prevent duplicate assignments
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_meets_coach     ON public.track_meets(coach_id);
CREATE INDEX IF NOT EXISTS idx_track_meets_athlete   ON public.track_meets(athlete_id);
CREATE INDEX IF NOT EXISTS idx_meet_events_meet      ON public.meet_events(meet_id);
CREATE INDEX IF NOT EXISTS idx_track_meets_meet_date ON public.track_meets(meet_date);
CREATE INDEX IF NOT EXISTS idx_athlete_meet_events_athlete ON public.athlete_meet_events(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_meet_events_event ON public.athlete_meet_events(meet_event_id);

-- Apply trigger to track_meets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_track_meets') THEN
    CREATE TRIGGER set_timestamp_track_meets
    BEFORE UPDATE ON public.track_meets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Apply trigger to meet_events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_meet_events') THEN
    CREATE TRIGGER set_timestamp_meet_events
    BEFORE UPDATE ON public.meet_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Apply trigger to athlete_meet_events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_athlete_meet_events') THEN
    CREATE TRIGGER set_timestamp_athlete_meet_events
    BEFORE UPDATE ON public.athlete_meet_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Row Level Security Policies

-- Enable RLS on track_meets
ALTER TABLE public.track_meets ENABLE ROW LEVEL SECURITY;

-- Track Meets RLS Policies
-- Anyone can view track meets
DROP POLICY IF EXISTS track_meets_select_all ON public.track_meets;
CREATE POLICY track_meets_select_all ON public.track_meets 
  FOR SELECT USING (true);

-- Only coaches can create, update, and delete track meets they own
DROP POLICY IF EXISTS track_meets_insert_coach ON public.track_meets;
CREATE POLICY track_meets_insert_coach ON public.track_meets 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS track_meets_update_coach ON public.track_meets;
CREATE POLICY track_meets_update_coach ON public.track_meets 
  FOR UPDATE USING (
    coach_id = auth.uid() OR
    athlete_id = auth.uid()
  );

DROP POLICY IF EXISTS track_meets_delete_coach ON public.track_meets;
CREATE POLICY track_meets_delete_coach ON public.track_meets 
  FOR DELETE USING (
    coach_id = auth.uid() OR
    athlete_id = auth.uid()
  );

-- Athletes can create track meets (for approval by coach)
DROP POLICY IF EXISTS track_meets_insert_athlete ON public.track_meets;
CREATE POLICY track_meets_insert_athlete ON public.track_meets 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'athlete'
    )
  );

-- Enable RLS on meet_events
ALTER TABLE public.meet_events ENABLE ROW LEVEL SECURITY;

-- Meet Events RLS Policies
-- Anyone can view meet events
DROP POLICY IF EXISTS meet_events_select_all ON public.meet_events;
CREATE POLICY meet_events_select_all ON public.meet_events 
  FOR SELECT USING (true);

-- Only coaches and athletes who own the meet can create, update, and delete meet events
DROP POLICY IF EXISTS meet_events_insert ON public.meet_events;
CREATE POLICY meet_events_insert ON public.meet_events 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.track_meets 
      WHERE id = meet_id AND (coach_id = auth.uid() OR athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS meet_events_update ON public.meet_events;
CREATE POLICY meet_events_update ON public.meet_events 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.track_meets 
      WHERE id = meet_id AND (coach_id = auth.uid() OR athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS meet_events_delete ON public.meet_events;
CREATE POLICY meet_events_delete ON public.meet_events 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.track_meets 
      WHERE id = meet_id AND (coach_id = auth.uid() OR athlete_id = auth.uid())
    )
  );

-- Enable RLS on athlete_meet_events
ALTER TABLE public.athlete_meet_events ENABLE ROW LEVEL SECURITY;

-- Athlete-Meet Events RLS Policies
-- Anyone can view assignments
DROP POLICY IF EXISTS athlete_meet_events_select_all ON public.athlete_meet_events;
CREATE POLICY athlete_meet_events_select_all ON public.athlete_meet_events 
  FOR SELECT USING (true);

-- Only coaches can create, update, and delete assignments
DROP POLICY IF EXISTS athlete_meet_events_insert_coach ON public.athlete_meet_events;
CREATE POLICY athlete_meet_events_insert_coach ON public.athlete_meet_events 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS athlete_meet_events_update_coach ON public.athlete_meet_events;
CREATE POLICY athlete_meet_events_update_coach ON public.athlete_meet_events 
  FOR UPDATE USING (
    assigned_by = auth.uid()
  );

DROP POLICY IF EXISTS athlete_meet_events_delete_coach ON public.athlete_meet_events;
CREATE POLICY athlete_meet_events_delete_coach ON public.athlete_meet_events 
  FOR DELETE USING (
    assigned_by = auth.uid() OR
    athlete_id = auth.uid()  -- Athletes can remove themselves
  );

-- Athletes can add themselves to events
DROP POLICY IF EXISTS athlete_meet_events_insert_athlete ON public.athlete_meet_events;
CREATE POLICY athlete_meet_events_insert_athlete ON public.athlete_meet_events 
  FOR INSERT WITH CHECK (
    athlete_id = auth.uid()
  ); 