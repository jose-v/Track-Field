-- Update workouts to work with exercise library
-- Create workout_exercises junction table to replace JSONB exercises array

-- Create workout_exercises table for proper relational structure
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
    order_in_workout INTEGER NOT NULL, -- To maintain sequence
    
    -- Exercise prescription details
    prescribed_sets TEXT, -- e.g., "3", "2x"
    prescribed_reps TEXT, -- e.g., "10", "8-12", "AMRAP"
    prescribed_duration TEXT, -- e.g., "30s", "5-min" (for timed exercises/rests)
    prescribed_distance TEXT, -- e.g., "150m", "5km"
    prescribed_weight TEXT, -- e.g., "50kg", "Bodyweight", "RPE 8"
    rest_interval TEXT, -- e.g., "60s", "Walk back"
    notes TEXT, -- Specific notes for this exercise in this workout
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique ordering within workout
    UNIQUE (workout_id, order_in_workout)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_in_workout);

-- Enable Row Level Security
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies - inherit from workout permissions
CREATE POLICY "Workout exercises inherit workout permissions"
ON public.workout_exercises FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workouts 
        WHERE workouts.id = workout_exercises.workout_id 
        AND (
            workouts.user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.workout_assignments 
                WHERE workout_assignments.workout_id = workouts.id 
                AND workout_assignments.athlete_id = auth.uid()
            )
        )
    )
);

-- Create function to update workout_exercises updated_at
CREATE OR REPLACE FUNCTION update_workout_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_workout_exercises_updated_at
    BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_exercises_updated_at();

-- Update exercise_results to reference exercise_library
-- Add exercise_id column to exercise_results for proper foreign key relationship
ALTER TABLE public.exercise_results 
ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_exercise_results_exercise_id ON public.exercise_results(exercise_id);

-- Function to migrate existing JSONB exercises to workout_exercises table
-- This will be called manually after the exercise library is populated
CREATE OR REPLACE FUNCTION migrate_workout_exercises()
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
            
            -- If exercise found, create workout_exercises entry
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
                    notes
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
                    exercise_data->>'notes'
                ) ON CONFLICT (workout_id, order_in_workout) DO NOTHING;
                
                -- Increment usage count for this exercise
                PERFORM increment_exercise_usage(exercise_lib_id);
            ELSE
                -- Log missing exercises (could create custom exercises here)
                RAISE NOTICE 'Exercise not found in library: %', exercise_data->>'name';
            END IF;
            
            exercise_order := exercise_order + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 