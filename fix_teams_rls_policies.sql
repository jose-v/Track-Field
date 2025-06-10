-- Fix missing RLS policies for teams table
-- This resolves the "row-level security policy" error when creating teams

-- Enable RLS on teams table if not already enabled
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;

-- Allow everyone to view teams (like other tables in the system)
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (true);

-- Allow team managers to create teams
CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.team_managers)
  );

-- Allow team managers to update their own teams
CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.team_managers)
  );

-- Allow team managers to delete their own teams
CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.team_managers)
  );

-- Add policy for team managers table as well (if not exists)
ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;

-- Drop existing team_managers policies to avoid conflicts
DROP POLICY IF EXISTS "team_managers_select_policy" ON public.team_managers;
DROP POLICY IF EXISTS "team_managers_insert_policy" ON public.team_managers;
DROP POLICY IF EXISTS "team_managers_update_policy" ON public.team_managers;

-- Allow anyone to view team managers (consistent with other profile tables)
CREATE POLICY "team_managers_select_policy" ON public.team_managers
  FOR SELECT USING (true);

-- Allow users to insert their own team manager profile
CREATE POLICY "team_managers_insert_policy" ON public.team_managers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own team manager profile
CREATE POLICY "team_managers_update_policy" ON public.team_managers
  FOR UPDATE USING (auth.uid() = id);

-- Verify the policies were created successfully
SELECT 'Teams RLS policies added successfully' AS status;

-- Show the current policies for verification
SELECT 
  schemaname,
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'WITH USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No CHECK clause' 
  END as check_clause
FROM pg_policies 
WHERE tablename IN ('teams', 'team_managers')
ORDER BY tablename, policyname; 