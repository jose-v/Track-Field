-- Restore RLS on teams table with proper working policies
-- This ensures security while allowing team management functionality

-- First, re-enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;

-- Create SELECT policy - allow viewing all active teams
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (is_active = true);

-- Create INSERT policy - allow authenticated users to create teams
CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = created_by
  );

-- Create UPDATE policy - allow team creators and team managers to update teams
CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    -- Team creator can update
    auth.uid() = created_by
    OR
    -- Team managers can update (using EXISTS instead of IN for better RLS compatibility)
    EXISTS (
      SELECT 1 
      FROM public.team_members tm 
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Create DELETE policy - only team creators can delete teams
CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'teams';

-- Show the policies that were created
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