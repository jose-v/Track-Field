-- Create custom_exercises table
CREATE TABLE IF NOT EXISTS custom_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    muscle_groups TEXT[], -- Array of muscle groups
    equipment TEXT[], -- Array of equipment needed
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_exercises_created_by ON custom_exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_category ON custom_exercises(category);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_difficulty ON custom_exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_created_at ON custom_exercises(created_at);

-- Enable Row Level Security
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own exercises
CREATE POLICY "Users can view their own exercises" ON custom_exercises
    FOR SELECT USING (auth.uid() = created_by);

-- Users can insert their own exercises
CREATE POLICY "Users can insert their own exercises" ON custom_exercises
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own exercises
CREATE POLICY "Users can update their own exercises" ON custom_exercises
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own exercises
CREATE POLICY "Users can delete their own exercises" ON custom_exercises
    FOR DELETE USING (auth.uid() = created_by);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_custom_exercises_updated_at
    BEFORE UPDATE ON custom_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 