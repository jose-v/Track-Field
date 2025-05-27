-- Add updated_at column to athlete_workouts table
ALTER TABLE public.athlete_workouts 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add a trigger to automatically update the column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_athlete_workouts_update_time
BEFORE UPDATE ON public.athlete_workouts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Comment: After running this script, follow these steps to use the column in API:
-- 1. Re-enable the updated_at field in the updateAssignmentStatus function in src/services/api.ts
-- 2. Before using, check if all athlete_workouts rows have been initialized with the default value 