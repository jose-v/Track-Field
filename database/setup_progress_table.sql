-- Create athlete_workout_progress table for tracking detailed exercise progress
CREATE TABLE IF NOT EXISTS public.athlete_workout_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_exercises JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(workout_id, athlete_id)
);

-- Add RLS policies for the new table
ALTER TABLE public.athlete_workout_progress ENABLE ROW LEVEL SECURITY;

-- Allow read access to the progress data
CREATE POLICY "Progress data is viewable by owner and coaches"
    ON public.athlete_workout_progress
    FOR SELECT
    USING (
        auth.uid() = athlete_id OR 
        EXISTS (
            SELECT 1 FROM public.coach_athletes 
            WHERE coach_id = auth.uid() AND athlete_id = athlete_workout_progress.athlete_id
        )
    );

-- Allow athletes to update their own progress
CREATE POLICY "Athletes can update their own progress"
    ON public.athlete_workout_progress
    FOR UPDATE
    USING (auth.uid() = athlete_id);

-- Allow athletes to insert their own progress
CREATE POLICY "Athletes can insert their own progress"
    ON public.athlete_workout_progress
    FOR INSERT
    WITH CHECK (auth.uid() = athlete_id);

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS athlete_workout_progress_workout_id_idx ON public.athlete_workout_progress(workout_id);
CREATE INDEX IF NOT EXISTS athlete_workout_progress_athlete_id_idx ON public.athlete_workout_progress(athlete_id);

-- Update the workout store functions to use this table
-- (This would need to be implemented in the front-end code) 