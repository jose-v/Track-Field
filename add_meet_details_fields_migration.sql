-- Migration: Add new meet details fields to track_meets table and migrate existing date data
-- Date: 2025-01-20

BEGIN;

-- Add new date fields for Multi Events and Track & Field
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS multi_events_start_date DATE,
ADD COLUMN IF NOT EXISTS multi_events_end_date DATE,
ADD COLUMN IF NOT EXISTS track_field_start_date DATE,
ADD COLUMN IF NOT EXISTS track_field_end_date DATE;

-- Add registration and event detail fields
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS registration_fee TEXT,
ADD COLUMN IF NOT EXISTS processing_fee TEXT,
ADD COLUMN IF NOT EXISTS packet_pickup_date DATE,
ADD COLUMN IF NOT EXISTS packet_pickup_address TEXT,
ADD COLUMN IF NOT EXISTS packet_pickup_city TEXT,
ADD COLUMN IF NOT EXISTS packet_pickup_state TEXT,
ADD COLUMN IF NOT EXISTS packet_pickup_zip TEXT,
ADD COLUMN IF NOT EXISTS entry_deadline_date DATE,
ADD COLUMN IF NOT EXISTS entry_deadline_time TIME,
ADD COLUMN IF NOT EXISTS tickets_link TEXT,
ADD COLUMN IF NOT EXISTS visitor_guide_link TEXT;

-- Migrate existing date data: copy meet_date and end_date to track_field dates
UPDATE track_meets 
SET 
  track_field_start_date = meet_date,
  track_field_end_date = end_date
WHERE track_field_start_date IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN track_meets.multi_events_start_date IS 'Start date for Multi Events portion of the meet';
COMMENT ON COLUMN track_meets.multi_events_end_date IS 'End date for Multi Events portion of the meet';
COMMENT ON COLUMN track_meets.track_field_start_date IS 'Start date for Track & Field portion of the meet';
COMMENT ON COLUMN track_meets.track_field_end_date IS 'End date for Track & Field portion of the meet';

COMMENT ON COLUMN track_meets.registration_fee IS 'Registration fee amount (as text, e.g., "$45.00")';
COMMENT ON COLUMN track_meets.processing_fee IS 'Processing fee amount (as text, e.g., "$3.50")';
COMMENT ON COLUMN track_meets.packet_pickup_date IS 'Date for packet pickup';
COMMENT ON COLUMN track_meets.packet_pickup_address IS 'Address for packet pickup location';
COMMENT ON COLUMN track_meets.packet_pickup_city IS 'City for packet pickup location';
COMMENT ON COLUMN track_meets.packet_pickup_state IS 'State for packet pickup location';
COMMENT ON COLUMN track_meets.packet_pickup_zip IS 'ZIP code for packet pickup location';
COMMENT ON COLUMN track_meets.entry_deadline_date IS 'Entry deadline date';
COMMENT ON COLUMN track_meets.entry_deadline_time IS 'Entry deadline time';
COMMENT ON COLUMN track_meets.tickets_link IS 'Web link for purchasing tickets';
COMMENT ON COLUMN track_meets.visitor_guide_link IS 'Web link for visitor guide information';

-- Create indexes for better performance on new date fields
CREATE INDEX IF NOT EXISTS idx_track_meets_multi_events_start_date ON track_meets(multi_events_start_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_multi_events_end_date ON track_meets(multi_events_end_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_track_field_start_date ON track_meets(track_field_start_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_track_field_end_date ON track_meets(track_field_end_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_packet_pickup_date ON track_meets(packet_pickup_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_entry_deadline_date ON track_meets(entry_deadline_date);

-- Optional: Update the meet_type field to use the new enum values if needed
-- You can uncomment this if you want to standardize existing meet_type values
-- UPDATE track_meets 
-- SET meet_type = CASE 
--   WHEN meet_type ILIKE '%multi%' OR meet_type ILIKE '%decathlon%' OR meet_type ILIKE '%heptathlon%' THEN 'multi_events'
--   ELSE 'track_field'
-- END
-- WHERE meet_type IS NOT NULL;

COMMIT;

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*) as total_meets FROM track_meets;
-- SELECT COUNT(*) as meets_with_track_field_dates FROM track_meets WHERE track_field_start_date IS NOT NULL;
-- SELECT COUNT(*) as meets_with_new_fields FROM track_meets WHERE registration_fee IS NOT NULL OR processing_fee IS NOT NULL;
