-- Add address, city, state, country, and zip_code columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States',
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add team, school, and coach columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS team VARCHAR(255),
ADD COLUMN IF NOT EXISTS school VARCHAR(255),
ADD COLUMN IF NOT EXISTS coach VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Comment columns for documentation
COMMENT ON COLUMN profiles.address IS 'User street address';
COMMENT ON COLUMN profiles.city IS 'User city of residence';
COMMENT ON COLUMN profiles.state IS 'User state/province of residence';
COMMENT ON COLUMN profiles.country IS 'User country of residence';
COMMENT ON COLUMN profiles.zip_code IS 'User postal/zip code';
COMMENT ON COLUMN profiles.team IS 'User team name';
COMMENT ON COLUMN profiles.school IS 'User school name';
COMMENT ON COLUMN profiles.coach IS 'User coach name'; 