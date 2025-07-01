-- Add country and zip fields to track_meets table
-- This adds country and zip to venue address, and country to packet pickup and lodging addresses

BEGIN;

-- Add country and zip fields to the main venue address
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT;

-- Add country field to packet pickup address (zip already exists)
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS packet_pickup_country TEXT;

-- Add country field to lodging address (zip already exists) 
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS lodging_country TEXT;

-- Add comments for documentation
COMMENT ON COLUMN track_meets.country IS 'Country of the meet venue (e.g., "United States", "Canada")';
COMMENT ON COLUMN track_meets.zip IS 'ZIP/Postal code of the meet venue (e.g., "12345", "K1A 0A6")';
COMMENT ON COLUMN track_meets.packet_pickup_country IS 'Country for packet pickup location';
COMMENT ON COLUMN track_meets.lodging_country IS 'Country for lodging location';

COMMIT; 