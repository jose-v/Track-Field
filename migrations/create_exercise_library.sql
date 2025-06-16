-- Create comprehensive exercise library with privacy controls
-- This replaces the need for separate custom_exercises table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main exercise library table
CREATE TABLE IF NOT EXISTS public.exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT CHECK (category IN (
        'warm_up', 'drill', 'plyometric', 'lift', 'run_interval', 
        'rest_interval', 'cool_down', 'flexibility', 'strength', 
        'running', 'recovery', 'custom'
    )),
    
    -- Enhanced metadata
    video_url TEXT,
    default_instructions TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    muscle_groups TEXT[], -- Array of muscle groups
    equipment TEXT[], -- Array of equipment needed
    
    -- Privacy and ownership controls
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_system_exercise BOOLEAN DEFAULT FALSE, -- True for predefined exercises
    is_public BOOLEAN DEFAULT FALSE, -- Privacy control for custom exercises
    
    -- Future organization support
    organization_id UUID DEFAULT NULL, -- For future team/school sharing
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0, -- How many times this exercise has been used
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON public.exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_user_id ON public.exercise_library(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_library_is_system ON public.exercise_library(is_system_exercise);
CREATE INDEX IF NOT EXISTS idx_exercise_library_is_public ON public.exercise_library(is_public);
CREATE INDEX IF NOT EXISTS idx_exercise_library_difficulty ON public.exercise_library(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercise_library_created_at ON public.exercise_library(created_at);
CREATE INDEX IF NOT EXISTS idx_exercise_library_usage_count ON public.exercise_library(usage_count);

-- Enable Row Level Security
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise visibility
CREATE POLICY "Exercise library visibility" 
ON public.exercise_library FOR SELECT USING (
    is_system_exercise = TRUE OR  -- System exercises always visible
    is_public = TRUE OR           -- Public custom exercises visible to all
    user_id = auth.uid()          -- Private exercises visible to creator only
);

-- Allow authenticated users to create custom exercises (private by default)
CREATE POLICY "Users can create custom exercises"
ON public.exercise_library FOR INSERT 
TO authenticated 
WITH CHECK (
    user_id = auth.uid() AND 
    is_system_exercise = FALSE
);

-- Users can update their own custom exercises
CREATE POLICY "Users can update their own custom exercises"
ON public.exercise_library FOR UPDATE USING (
    user_id = auth.uid() AND is_system_exercise = FALSE
) WITH CHECK (
    user_id = auth.uid() AND is_system_exercise = FALSE
);

-- Users can delete their own custom exercises
CREATE POLICY "Users can delete their own custom exercises"
ON public.exercise_library FOR DELETE USING (
    user_id = auth.uid() AND is_system_exercise = FALSE
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercise_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_exercise_library_updated_at
    BEFORE UPDATE ON public.exercise_library
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_library_updated_at();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_exercise_usage(exercise_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.exercise_library 
    SET usage_count = usage_count + 1 
    WHERE id = exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 