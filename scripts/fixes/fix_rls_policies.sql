-- Fix RLS policy recursion errors
-- This script replaces the recursive policies with simpler, safer ones

-- Step 1: Drop all existing policies to start clean
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

-- Step 2: Create simple, non-recursive policies for training_plans
CREATE POLICY "training_plans_select_policy" ON training_plans
    FOR SELECT USING (
        auth.uid() = coach_id OR
        auth.uid() IN (
            SELECT p.id FROM profiles p WHERE p.role = 'coach'
        )
    );

CREATE POLICY "training_plans_insert_policy" ON training_plans
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "training_plans_update_policy" ON training_plans
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "training_plans_delete_policy" ON training_plans
    FOR DELETE USING (auth.uid() = coach_id);

-- Step 3: Create simple policies for training_plan_assignments
CREATE POLICY "training_plan_assignments_select_policy" ON training_plan_assignments
    FOR SELECT USING (
        auth.uid() = athlete_id OR
        auth.uid() = assigned_by OR
        auth.uid() IN (
            SELECT p.id FROM profiles p WHERE p.role = 'coach'
        )
    );

CREATE POLICY "training_plan_assignments_insert_policy" ON training_plan_assignments
    FOR INSERT WITH CHECK (
        auth.uid() = assigned_by OR
        auth.uid() IN (
            SELECT p.id FROM profiles p WHERE p.role = 'coach'
        )
    );

CREATE POLICY "training_plan_assignments_update_policy" ON training_plan_assignments
    FOR UPDATE USING (
        auth.uid() = athlete_id OR
        auth.uid() = assigned_by OR
        auth.uid() IN (
            SELECT p.id FROM profiles p WHERE p.role = 'coach'
        )
    );

CREATE POLICY "training_plan_assignments_delete_policy" ON training_plan_assignments
    FOR DELETE USING (
        auth.uid() = assigned_by OR
        auth.uid() IN (
            SELECT p.id FROM profiles p WHERE p.role = 'coach'
        )
    );

-- Step 4: Verify policies are created
SELECT 'RLS policies updated successfully' as status;

-- Show current policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('training_plans', 'training_plan_assignments')
ORDER BY tablename, policyname; 