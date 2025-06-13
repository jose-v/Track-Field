-- Fix RLS Policy for team_members table
-- The current update policy has issues with subqueries in UPDATE context

-- Drop the existing problematic update policy
DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;

-- Create a new, simpler update policy that works correctly
CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (
    -- Allow users to update their own memberships
    auth.uid() = user_id 
    OR 
    -- Allow coaches and managers to update memberships in their teams
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Also fix the insert policy to use EXISTS instead of IN for consistency
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;

CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (
    -- Allow users to insert their own memberships
    auth.uid() = user_id 
    OR 
    -- Allow coaches and managers to add members to their teams
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Fix the delete policy as well
DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;

CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (
    -- Allow users to delete their own memberships
    auth.uid() = user_id 
    OR 
    -- Allow coaches and managers to delete memberships in their teams
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Test the policy by checking if a coach can see their permissions
-- (This is just for verification - you can run this in Supabase SQL editor)
SELECT 
  'Policy test' as info,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.team_members coach_tm 
      WHERE coach_tm.team_id = tm.team_id 
      AND coach_tm.user_id = auth.uid()
      AND coach_tm.role IN ('coach', 'manager') 
      AND coach_tm.status = 'active'
    ) THEN 'CAN_UPDATE'
    ELSE 'CANNOT_UPDATE'
  END as update_permission
FROM public.team_members tm
WHERE tm.status = 'active'
LIMIT 10; 