-- PART 1: RLS Status and Policy Check
SELECT 
    'RLS Status Check' as investigation_step,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'unified_workout_assignments';

-- Check all policies (should be empty if RLS is disabled)
SELECT 
    'Policy Check' as investigation_step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'unified_workout_assignments'; 