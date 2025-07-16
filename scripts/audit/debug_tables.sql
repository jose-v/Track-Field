-- Debug script to check table structure and existence
-- Run this in your Supabase SQL editor

-- 1. Check what tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%training%' OR table_name LIKE '%monthly%')
ORDER BY table_name;

-- 2. Check if training_plans exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'training_plans'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if training_plan_assignments exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'training_plan_assignments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check what RLS policies exist for these tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('training_plans', 'training_plan_assignments')
ORDER BY tablename, policyname;

-- 5. Check foreign key constraints
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
WHERE tc.table_name IN ('training_plans', 'training_plan_assignments')
    AND tc.constraint_type = 'FOREIGN KEY'; 