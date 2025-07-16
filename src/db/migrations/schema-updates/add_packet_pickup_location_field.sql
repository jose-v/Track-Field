-- Add packet pickup location field to track_meets table
-- This adds a location/place name field for packet pickup (e.g., "Lakeland Elementary School Cafeteria")

BEGIN;

-- Add packet pickup location field
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS packet_pickup_location TEXT;

-- Add comment for documentation
COMMENT ON COLUMN track_meets.packet_pickup_location IS 'Specific location/place name for packet pickup (e.g., "Lakeland Elementary School Cafeteria", "Main Gym Lobby")';

COMMIT; 