-- Comprehensive fix for training plans errors
-- This script ensures all tables exist with proper structure and policies

-- Step 1: Create training_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    weeks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_by UUID REFERENCES profiles(id) DEFAULT NULL
);

-- Step 2: Add missing columns to existing training_plans table
ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month >= 1 AND month <= 12);

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 2020 AND year <= 2100);

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS weeks JSONB DEFAULT '[]'::jsonb;

-- Step 3: Add soft delete columns if they don't exist
ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;

-- Step 4: Create training_plan_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS training_plan_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    UNIQUE(training_plan_id, athlete_id)
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_plans_coach_id ON training_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_deleted_at ON training_plans(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_plans_month_year ON training_plans(month, year);

CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_plan_id ON training_plan_assignments(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_athlete_id ON training_plan_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_status ON training_plan_assignments(status);

-- Step 6: Enable RLS on both tables
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_assignments ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Coaches can view their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Coaches can create training plans" ON training_plans;
DROP POLICY IF EXISTS "Coaches can update their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Coaches can delete their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Athletes can view assigned training plans" ON training_plans;

DROP POLICY IF EXISTS "Coaches can view training plan assignments" ON training_plan_assignments;
DROP POLICY IF EXISTS "Coaches can create training plan assignments" ON training_plan_assignments;
DROP POLICY IF EXISTS "Coaches can update training plan assignments" ON training_plan_assignments;
DROP POLICY IF EXISTS "Coaches can delete training plan assignments" ON training_plan_assignments;
DROP POLICY IF EXISTS "Athletes can view their training plan assignments" ON training_plan_assignments;

-- Step 8: Create comprehensive RLS policies for training_plans
CREATE POLICY "Coaches can view their own training plans" ON training_plans
    FOR SELECT USING (
        auth.uid() = coach_id 
        AND (deleted_at IS NULL OR auth.uid() = coach_id)
    );

CREATE POLICY "Coaches can create training plans" ON training_plans
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own training plans" ON training_plans
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own training plans" ON training_plans
    FOR DELETE USING (auth.uid() = coach_id);

CREATE POLICY "Athletes can view assigned training plans" ON training_plans
    FOR SELECT USING (
        auth.uid() IN (
            SELECT athlete_id 
            FROM training_plan_assignments 
            WHERE training_plan_id = training_plans.id
        )
        AND deleted_at IS NULL
    );

-- Step 9: Create comprehensive RLS policies for training_plan_assignments
CREATE POLICY "Coaches can view training plan assignments" ON training_plan_assignments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT coach_id 
            FROM training_plans 
            WHERE id = training_plan_id
        )
        OR auth.uid() = assigned_by
    );

CREATE POLICY "Coaches can create training plan assignments" ON training_plan_assignments
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT coach_id 
            FROM training_plans 
            WHERE id = training_plan_id
        )
        OR auth.uid() = assigned_by
    );

CREATE POLICY "Coaches can update training plan assignments" ON training_plan_assignments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT coach_id 
            FROM training_plans 
            WHERE id = training_plan_id
        )
        OR auth.uid() = assigned_by
    );

CREATE POLICY "Coaches can delete training plan assignments" ON training_plan_assignments
    FOR DELETE USING (
        auth.uid() IN (
            SELECT coach_id 
            FROM training_plans 
            WHERE id = training_plan_id
        )
        OR auth.uid() = assigned_by
    );

CREATE POLICY "Athletes can view their training plan assignments" ON training_plan_assignments
    FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update their assignment status" ON training_plan_assignments
    FOR UPDATE USING (auth.uid() = athlete_id)
    WITH CHECK (auth.uid() = athlete_id);

-- Step 10: Create updated_at trigger for training_plans
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
    BEFORE UPDATE ON training_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Grant necessary permissions
GRANT ALL ON training_plans TO authenticated;
GRANT ALL ON training_plan_assignments TO authenticated;

-- Step 12: Verify the setup
SELECT 'training_plans table created successfully' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_plans');

SELECT 'training_plan_assignments table created successfully' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_plan_assignments');

-- Show final table structure
SELECT 'Training Plans Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_plans' 
ORDER BY ordinal_position;

SELECT 'Training Plan Assignments Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_plan_assignments' 
ORDER BY ordinal_position; 