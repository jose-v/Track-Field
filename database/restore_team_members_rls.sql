-- Restore RLS on team_members table with working policies
-- This ensures security while allowing proper functionality

-- First, re-enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;

-- Create SELECT policy - allow viewing all team memberships
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (true);

-- Create INSERT policy - allow users to join teams and coaches/managers to add members
CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (
    -- Users can add themselves to teams
    auth.uid() = user_id 
    OR 
    -- Coaches and managers can add members to their teams
    auth.uid() IN (
      SELECT tm.user_id 
      FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Create UPDATE policy - allow users to update their own memberships and coaches/managers to update team memberships
CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (
    -- Users can update their own memberships
    auth.uid() = user_id 
    OR 
    -- Coaches and managers can update memberships in their teams
    auth.uid() IN (
      SELECT tm.user_id 
      FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Create DELETE policy - allow users to remove themselves and coaches/managers to remove team members
CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (
    -- Users can remove themselves from teams
    auth.uid() = user_id 
    OR 
    -- Coaches and managers can remove members from their teams
    auth.uid() IN (
      SELECT tm.user_id 
      FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_members';

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
WHERE tablename = 'team_members'
ORDER BY policyname; 