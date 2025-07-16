-- Add venue address field to track_meets table
-- This field will store the street address of the venue

BEGIN;

-- Add the address field to the track_meets table
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN track_meets.address IS 'Street address of the meet venue (e.g., "123 Main Street")';

COMMIT; 