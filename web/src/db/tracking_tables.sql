-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sleep_records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('poor', 'fair', 'good', 'excellent')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sleep_records_athlete_id ON sleep_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_date ON sleep_records(sleep_date);

-- Create eating_records table
CREATE TABLE IF NOT EXISTS eating_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER CHECK (calories >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_eating_records_athlete_id ON eating_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_eating_records_date ON eating_records(record_date);

-- Create trigger to update the updated_at field automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to sleep_records
DROP TRIGGER IF EXISTS set_timestamp_sleep_records ON sleep_records;
CREATE TRIGGER set_timestamp_sleep_records
BEFORE UPDATE ON sleep_records
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Apply trigger to eating_records
DROP TRIGGER IF EXISTS set_timestamp_eating_records ON eating_records;
CREATE TRIGGER set_timestamp_eating_records
BEFORE UPDATE ON eating_records
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security Policies
-- Enable RLS on sleep_records
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

-- Sleep Records RLS Policies
CREATE POLICY sleep_records_select_own ON sleep_records 
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY sleep_records_insert_own ON sleep_records 
  FOR INSERT WITH CHECK (athlete_id = auth.uid());

CREATE POLICY sleep_records_update_own ON sleep_records 
  FOR UPDATE USING (athlete_id = auth.uid());

CREATE POLICY sleep_records_delete_own ON sleep_records 
  FOR DELETE USING (athlete_id = auth.uid());

-- Coach can view sleep records for their athletes
CREATE POLICY sleep_records_select_coach ON sleep_records 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes ca
      WHERE ca.athlete_id = sleep_records.athlete_id
      AND ca.coach_id = auth.uid()
    )
  );

-- Enable RLS on eating_records
ALTER TABLE eating_records ENABLE ROW LEVEL SECURITY;

-- Eating Records RLS Policies
CREATE POLICY eating_records_select_own ON eating_records 
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY eating_records_insert_own ON eating_records 
  FOR INSERT WITH CHECK (athlete_id = auth.uid());

CREATE POLICY eating_records_update_own ON eating_records 
  FOR UPDATE USING (athlete_id = auth.uid());

CREATE POLICY eating_records_delete_own ON eating_records 
  FOR DELETE USING (athlete_id = auth.uid());

-- Coach can view eating records for their athletes
CREATE POLICY eating_records_select_coach ON eating_records 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes ca
      WHERE ca.athlete_id = eating_records.athlete_id
      AND ca.coach_id = auth.uid()
    )
  ); 