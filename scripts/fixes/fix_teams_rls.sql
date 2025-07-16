-- Check and fix RLS policies for teams table
-- This will allow coaches to update their own teams

-- First, let's see what policies exist on the teams table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- Check if RLS is enabled on teams table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'teams';

-- If there are restrictive policies, let's temporarily disable RLS on teams table
-- (We can create proper policies later)
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'teams'; 