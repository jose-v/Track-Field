-- Debug script for loop tables
-- Run this in Supabase SQL Editor to diagnose 406 errors

-- 1. Check if loop tables exist
SELECT 'LOOP TABLES EXISTENCE' as check_type;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'loop_%'
ORDER BY table_name;

-- 2. Check loop_likes table structure
SELECT 'LOOP_LIKES TABLE STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'loop_likes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as check_type;
SELECT
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
WHERE tc.table_name = 'loop_likes'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Check RLS policies
SELECT 'RLS POLICIES' as check_type;
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'loop_likes'
ORDER BY policyname;

-- 5. Check if RLS is enabled
SELECT 'RLS STATUS' as check_type;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'loop_likes';

-- 6. Try to query loop_likes table directly
SELECT 'DIRECT QUERY TEST' as check_type;
SELECT COUNT(*) as total_likes FROM loop_likes;

-- 7. Check if referenced tables exist
SELECT 'REFERENCED TABLES' as check_type;
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loop_posts') 
        THEN 'loop_posts EXISTS' 
        ELSE 'loop_posts MISSING' 
    END as loop_posts_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN 'profiles EXISTS' 
        ELSE 'profiles MISSING' 
    END as profiles_status;

-- 8. Test a simple select that might be causing the 406 error
SELECT 'TEST SELECT' as check_type;
SELECT id, post_id, user_id, created_at 
FROM loop_likes 
LIMIT 1; 