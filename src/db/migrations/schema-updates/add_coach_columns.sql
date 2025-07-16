-- Add missing columns to coaches table for gender, date_of_birth, and events
-- These columns are needed for coach profile functionality

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS date_of_birth date;

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS events text[];

-- Update the schema documentation comment
COMMENT ON TABLE coaches IS 'Coach-specific data including specialties, certifications, gender, date of birth, and events';
COMMENT ON COLUMN coaches.gender IS 'Coach gender (male, female, other)';
COMMENT ON COLUMN coaches.date_of_birth IS 'Coach date of birth';
COMMENT ON COLUMN coaches.events IS 'Events the coach specializes in (text array)'; 