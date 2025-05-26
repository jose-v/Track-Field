-- Add gender, birth_date, and events columns to coaches table
ALTER TABLE public.coaches
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS events TEXT[];

-- Comment columns for documentation
COMMENT ON COLUMN coaches.gender IS 'Coach gender';
COMMENT ON COLUMN coaches.birth_date IS 'Coach date of birth';
COMMENT ON COLUMN coaches.events IS 'Coach specialization events'; 