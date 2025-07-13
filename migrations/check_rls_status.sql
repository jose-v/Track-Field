-- Check RLS status for unified_workout_assignments table
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'unified_workout_assignments';

-- Also check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'unified_workout_assignments'; 