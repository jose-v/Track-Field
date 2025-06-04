-- Create exercise_library table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT CHECK (category IN (
        'warm_up', 'drill', 'plyometric', 'lift', 'run_interval', 
        'rest_interval', 'cool_down', 'flexibility', 'strength', 
        'running', 'recovery', 'custom'
    )),
    video_url TEXT,
    default_instructions TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_system_exercise BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Exercise library is viewable by everyone"
    ON public.exercise_library FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exercises"
    ON public.exercise_library FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own custom exercises"
    ON public.exercise_library FOR UPDATE USING (
        (user_id = auth.uid() AND is_system_exercise = FALSE)
    );

CREATE POLICY "Users can delete their own custom exercises"
    ON public.exercise_library FOR DELETE USING (
        (user_id = auth.uid() AND is_system_exercise = FALSE)
    );