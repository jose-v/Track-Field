-- Fix foreign key relationships for training plans
-- This script ensures all foreign key constraints are properly named and created

-- Step 1: Drop existing foreign key constraints if they exist (to recreate with proper names)
ALTER TABLE training_plan_assignments DROP CONSTRAINT IF EXISTS training_plan_assignments_training_plan_id_fkey;
ALTER TABLE training_plan_assignments DROP CONSTRAINT IF EXISTS training_plan_assignments_athlete_id_fkey;
ALTER TABLE training_plan_assignments DROP CONSTRAINT IF EXISTS training_plan_assignments_assigned_by_fkey;
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS training_plans_coach_id_fkey;
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS training_plans_deleted_by_fkey;

-- Step 2: Recreate foreign key constraints with proper names that PostgREST expects
ALTER TABLE training_plans 
ADD CONSTRAINT training_plans_coach_id_fkey 
FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE training_plans 
ADD CONSTRAINT training_plans_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE training_plan_assignments 
ADD CONSTRAINT training_plan_assignments_training_plan_id_fkey 
FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE;

ALTER TABLE training_plan_assignments 
ADD CONSTRAINT training_plan_assignments_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE training_plan_assignments 
ADD CONSTRAINT training_plan_assignments_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 3: Verify the foreign keys exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('training_plans', 'training_plan_assignments')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Step 4: Refresh PostgREST schema cache (this forces PostgREST to reload foreign key relationships)
NOTIFY pgrst, 'reload schema'; 