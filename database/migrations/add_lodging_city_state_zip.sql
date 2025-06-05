-- Migration: Add lodging city, state, and zip fields to track_meets table
-- Date: 2024-01-XX

-- Add lodging address components to track_meets table
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS lodging_city TEXT,
ADD COLUMN IF NOT EXISTS lodging_state TEXT,
ADD COLUMN IF NOT EXISTS lodging_zip TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN track_meets.lodging_city IS 'City where the lodging accommodation is located';
COMMENT ON COLUMN track_meets.lodging_state IS 'State where the lodging accommodation is located';
COMMENT ON COLUMN track_meets.lodging_zip IS 'ZIP/postal code of the lodging accommodation';

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_track_meets_lodging_city ON track_meets(lodging_city);
CREATE INDEX IF NOT EXISTS idx_track_meets_lodging_state ON track_meets(lodging_state); 