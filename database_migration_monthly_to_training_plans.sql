-- 🚀 COMPREHENSIVE MIGRATION: monthly_plans → training_plans
-- This script handles the complete migration from monthly_plans to training_plans
-- Run this in Supabase SQL Editor

-- ====================================
-- STEP 1: CHECK EXISTING STRUCTURE
-- ====================================

-- Check if monthly_plans table still exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_plans') THEN
        RAISE NOTICE 'Found existing monthly_plans table - will migrate data';
    ELSE
        RAISE NOTICE 'No monthly_plans table found - will create training_plans from scratch';
    END IF;
END $$;

-- ====================================
-- STEP 2: CREATE training_plans TABLE
-- ====================================

CREATE TABLE IF NOT EXISTS training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    weeks JSONB DEFAULT '[]'::jsonb,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_by UUID REFERENCES profiles(id) DEFAULT NULL
);

-- Add missing columns to existing training_plans table if they exist
ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month >= 1 AND month <= 12);

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 2020 AND year <= 2100);

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS weeks JSONB DEFAULT '[]'::jsonb;

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE training_plans 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;

-- ====================================
-- STEP 3: MIGRATE DATA FROM monthly_plans (if it exists)
-- ====================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_plans') THEN
        
        -- Migrate data from monthly_plans to training_plans
        INSERT INTO training_plans (
            id, name, description, coach_id, month, year, weeks, 
            created_at, updated_at, deleted_at, deleted_by
        )
        SELECT 
            id, name, description, coach_id, month, year, 
            COALESCE(weeks, '[]'::jsonb) as weeks,
            created_at, updated_at, deleted_at, deleted_by
        FROM monthly_plans
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Data migrated from monthly_plans to training_plans';
    END IF;
END $$;

-- ====================================
-- STEP 4: CREATE training_plan_assignments TABLE  
-- ====================================

CREATE TABLE IF NOT EXISTS training_plan_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(training_plan_id, athlete_id)
);

-- Migrate data from monthly_plan_assignments if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_plan_assignments') THEN
        
        INSERT INTO training_plan_assignments (
            id, training_plan_id, athlete_id, assigned_at, start_date, 
            status, assigned_by, created_at, updated_at
        )
        SELECT 
            id, 
            monthly_plan_id as training_plan_id, 
            athlete_id, 
            assigned_at, 
            start_date, 
            COALESCE(status, 'assigned') as status,
            assigned_by, 
            created_at, 
            updated_at
        FROM monthly_plan_assignments
        ON CONFLICT (training_plan_id, athlete_id) DO NOTHING;

        RAISE NOTICE 'Data migrated from monthly_plan_assignments to training_plan_assignments';
    END IF;
END $$;

-- ====================================
-- STEP 5: CREATE INDEXES
-- ====================================

CREATE INDEX IF NOT EXISTS idx_training_plans_coach_id ON training_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_deleted_at ON training_plans(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_plans_month_year ON training_plans(month, year);
CREATE INDEX IF NOT EXISTS idx_training_plans_start_date ON training_plans(start_date);
CREATE INDEX IF NOT EXISTS idx_training_plans_end_date ON training_plans(end_date);

CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_plan_id ON training_plan_assignments(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_athlete_id ON training_plan_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_status ON training_plan_assignments(status);
CREATE INDEX IF NOT EXISTS idx_training_plan_assignments_start_date ON training_plan_assignments(start_date);

-- ====================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ====================================

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_assignments ENABLE ROW LEVEL SECURITY;

-- ====================================
-- STEP 7: DROP OLD POLICIES
-- ====================================

-- Drop old monthly_plans policies
DROP POLICY IF EXISTS "Coaches can view their own monthly plans" ON monthly_plans;
DROP POLICY IF EXISTS "Coaches can create monthly plans" ON monthly_plans;
DROP POLICY IF EXISTS "Coaches can update their own monthly plans" ON monthly_plans;
DROP POLICY IF EXISTS "Coaches can delete their own monthly plans" ON monthly_plans;

-- Drop old training_plans policies (to recreate them)
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
DROP POLICY IF EXISTS "Athletes can update their assignment status" ON training_plan_assignments;

-- ====================================
-- STEP 8: CREATE RLS POLICIES
-- ====================================

-- Training Plans Policies
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

-- Training Plan Assignments Policies
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

-- ====================================
-- STEP 9: CREATE TRIGGERS
-- ====================================

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

DROP TRIGGER IF EXISTS update_training_plan_assignments_updated_at ON training_plan_assignments;
CREATE TRIGGER update_training_plan_assignments_updated_at
    BEFORE UPDATE ON training_plan_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- STEP 10: GRANT PERMISSIONS
-- ====================================

GRANT ALL ON training_plans TO authenticated;
GRANT ALL ON training_plan_assignments TO authenticated;

-- ====================================
-- STEP 11: VERIFICATION & CLEANUP
-- ====================================

-- Verify the migration worked
SELECT 'Migration completed successfully!' as status;

SELECT 
    'training_plans' as table_name,
    COUNT(*) as record_count
FROM training_plans;

SELECT 
    'training_plan_assignments' as table_name,
    COUNT(*) as record_count
FROM training_plan_assignments;

-- Show table structures
SELECT 'TRAINING PLANS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_plans' 
ORDER BY ordinal_position;

SELECT 'TRAINING PLAN ASSIGNMENTS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_plan_assignments' 
ORDER BY ordinal_position;

-- Optional: Drop old tables (uncomment if you're sure the migration worked)
-- DROP TABLE IF EXISTS monthly_plan_assignments CASCADE;
-- DROP TABLE IF EXISTS monthly_plans CASCADE;

SELECT '✅ MIGRATION COMPLETE! Your training_plans system is ready.' as final_status; 