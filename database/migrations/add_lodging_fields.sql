-- Migration: Add lodging fields to track_meets table
-- Date: 2024-12-19

-- Add lodging columns to track_meets table
ALTER TABLE track_meets 
ADD COLUMN IF NOT EXISTS lodging_type TEXT,
ADD COLUMN IF NOT EXISTS lodging_address TEXT,
ADD COLUMN IF NOT EXISTS lodging_phone TEXT,
ADD COLUMN IF NOT EXISTS lodging_website TEXT,
ADD COLUMN IF NOT EXISTS lodging_checkin_date DATE,
ADD COLUMN IF NOT EXISTS lodging_checkout_date DATE,
ADD COLUMN IF NOT EXISTS lodging_checkin_time TIME,
ADD COLUMN IF NOT EXISTS lodging_checkout_time TIME;

-- Add comments for documentation
COMMENT ON COLUMN track_meets.lodging_type IS 'Type of lodging: Hotel, Motel, Airbnb, Hostel, Resort, Vacation Rental, Host Family, Other';
COMMENT ON COLUMN track_meets.lodging_address IS 'Full address of the lodging accommodation';
COMMENT ON COLUMN track_meets.lodging_phone IS 'Phone number of the lodging accommodation';
COMMENT ON COLUMN track_meets.lodging_website IS 'Website URL of the lodging accommodation';
COMMENT ON COLUMN track_meets.lodging_checkin_date IS 'Check-in date for the lodging';
COMMENT ON COLUMN track_meets.lodging_checkout_date IS 'Check-out date for the lodging';
COMMENT ON COLUMN track_meets.lodging_checkin_time IS 'Check-in time for the lodging';
COMMENT ON COLUMN track_meets.lodging_checkout_time IS 'Check-out time for the lodging';

-- Create indexes for better performance on date fields
CREATE INDEX IF NOT EXISTS idx_track_meets_lodging_checkin_date ON track_meets(lodging_checkin_date);
CREATE INDEX IF NOT EXISTS idx_track_meets_lodging_checkout_date ON track_meets(lodging_checkout_date); 