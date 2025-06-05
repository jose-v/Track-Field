-- Add assistant coach fields to track_meets table
-- Supports up to 3 assistant coaches with name, phone, and email each

-- Assistant Coach 1
ALTER TABLE track_meets ADD COLUMN assistant_coach_1_name TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_1_phone TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_1_email TEXT;

-- Assistant Coach 2  
ALTER TABLE track_meets ADD COLUMN assistant_coach_2_name TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_2_phone TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_2_email TEXT;

-- Assistant Coach 3
ALTER TABLE track_meets ADD COLUMN assistant_coach_3_name TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_3_phone TEXT;
ALTER TABLE track_meets ADD COLUMN assistant_coach_3_email TEXT;

-- Add comments to describe the fields
COMMENT ON COLUMN track_meets.assistant_coach_1_name IS 'Name of first assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_1_phone IS 'Phone number of first assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_1_email IS 'Email address of first assistant coach';

COMMENT ON COLUMN track_meets.assistant_coach_2_name IS 'Name of second assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_2_phone IS 'Phone number of second assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_2_email IS 'Email address of second assistant coach';

COMMENT ON COLUMN track_meets.assistant_coach_3_name IS 'Name of third assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_3_phone IS 'Phone number of third assistant coach';
COMMENT ON COLUMN track_meets.assistant_coach_3_email IS 'Email address of third assistant coach'; 