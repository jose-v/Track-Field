-- SYSTEMATIC INVESTIGATION OF 406 ERRORS
-- Let's gather comprehensive information about the current state

-- 1. Verify RLS status on unified_workout_assignments
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

-- 2. Check all policies on unified_workout_assignments (should be none if RLS is disabled)
SELECT 
    'Policy Check' as investigation_step,
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

-- 3. Check RLS status on ALL tables (to find other tables that might be causing issues)
SELECT 
    'All Tables RLS Status' as investigation_step,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- 4. Test direct query to unified_workout_assignments (should work if RLS is disabled)
SELECT 
    'Direct Query Test' as investigation_step,
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_count,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count
FROM public.unified_workout_assignments;

-- 5. Check for any foreign key constraints or triggers that might cause issues
SELECT 
    'Constraint Check' as investigation_step,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
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
WHERE tc.table_name = 'unified_workout_assignments'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 6. Check current user/role information
SELECT 
    'User Context Check' as investigation_step,
    current_user,
    session_user,
    current_setting('role') as current_role; 