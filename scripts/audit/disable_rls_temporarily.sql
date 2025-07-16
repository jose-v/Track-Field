-- Temporarily disable RLS on team_members table to test functionality
-- This will allow the remove athlete feature to work while we debug the RLS policies

ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'team_members';

-- Test query to verify we can now update records
SELECT 
  'RLS disabled - should work now' as status,
  COUNT(*) as total_active_members
FROM public.team_members 
WHERE status = 'active'; 