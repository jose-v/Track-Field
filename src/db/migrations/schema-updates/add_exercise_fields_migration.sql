-- Migration: Add new exercise fields to workout_exercises table
-- Date: $(date +%Y-%m-%d)
-- Description: Add contacts, intensity, direction, and movement_notes fields to support enhanced exercise prescription

-- Add new fields to workout_exercises table
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS contacts TEXT, -- e.g., "20", "15 each leg"
ADD COLUMN IF NOT EXISTS intensity TEXT, -- e.g., "75%", "RPE 8", "Moderate"
ADD COLUMN IF NOT EXISTS direction TEXT, -- e.g., "Forward", "Backward", "Lateral"
ADD COLUMN IF NOT EXISTS movement_notes TEXT; -- Larger text field for detailed movement instructions

-- Create indexes for the new fields (optional, for performance if needed)
CREATE INDEX IF NOT EXISTS idx_workout_exercises_contacts ON public.workout_exercises(contacts);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_intensity ON public.workout_exercises(intensity);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_direction ON public.workout_exercises(direction);

-- Add comments for documentation
COMMENT ON COLUMN public.workout_exercises.contacts IS 'Number of contacts or repetitions for the exercise (e.g., "20", "15 each leg")';
COMMENT ON COLUMN public.workout_exercises.intensity IS 'Intensity level for the exercise (e.g., "75%", "RPE 8", "Moderate")';
COMMENT ON COLUMN public.workout_exercises.direction IS 'Direction of movement for the exercise (e.g., "Forward", "Backward", "Lateral")';
COMMENT ON COLUMN public.workout_exercises.movement_notes IS 'Detailed movement instructions and notes for the exercise';

-- Update the migrate_workout_exercises function to handle the new fields
CREATE OR REPLACE FUNCTION migrate_workout_exercises_with_new_fields()
RETURNS void AS $$
DECLARE
    workout_record RECORD;
    exercise_record RECORD;
    exercise_data JSONB;
    exercise_order INTEGER;
    exercise_lib_id UUID;
BEGIN
    -- Loop through all workouts that have exercises in JSONB format
    FOR workout_record IN 
        SELECT id, exercises 
        FROM public.workouts 
        WHERE exercises IS NOT NULL 
        AND jsonb_array_length(exercises) > 0
    LOOP
        exercise_order := 1;
        
        -- Loop through each exercise in the JSONB array
        FOR exercise_data IN 
            SELECT jsonb_array_elements(workout_record.exercises)
        LOOP
            -- Try to find matching exercise in exercise_library by name
            SELECT id INTO exercise_lib_id
            FROM public.exercise_library
            WHERE name = (exercise_data->>'name')
            LIMIT 1;
            
            -- If exercise found, create workout_exercises entry with all fields
            IF exercise_lib_id IS NOT NULL THEN
                INSERT INTO public.workout_exercises (
                    workout_id,
                    exercise_id,
                    order_in_workout,
                    prescribed_sets,
                    prescribed_reps,
                    prescribed_duration,
                    prescribed_distance,
                    prescribed_weight,
                    rest_interval,
                    notes,
                    contacts,
                    intensity,
                    direction,
                    movement_notes
                ) VALUES (
                    workout_record.id,
                    exercise_lib_id,
                    exercise_order,
                    exercise_data->>'sets',
                    exercise_data->>'reps',
                    exercise_data->>'duration',
                    exercise_data->>'distance',
                    exercise_data->>'weight',
                    exercise_data->>'rest',
                    exercise_data->>'notes',
                    exercise_data->>'contacts',
                    exercise_data->>'intensity',
                    exercise_data->>'direction',
                    exercise_data->>'movement_notes'
                ) ON CONFLICT (workout_id, order_in_workout) DO UPDATE SET
                    contacts = EXCLUDED.contacts,
                    intensity = EXCLUDED.intensity,
                    direction = EXCLUDED.direction,
                    movement_notes = EXCLUDED.movement_notes;
                
            ELSE
                -- Log missing exercises
                RAISE NOTICE 'Exercise not found in library: %', exercise_data->>'name';
            END IF;
            
            exercise_order := exercise_order + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Verification queries
-- Run these after migration to verify the new fields exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'workout_exercises' 
-- AND column_name IN ('contacts', 'intensity', 'direction', 'movement_notes'); 