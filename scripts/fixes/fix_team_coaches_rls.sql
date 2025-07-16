-- Fix team_coaches RLS policies to allow coaches to check their own assignments
-- This is needed for the join team functionality

-- Update the existing select policy to allow coaches to read their own records
DROP POLICY IF EXISTS "team_coaches_select_policy" ON public.team_coaches;

CREATE POLICY "team_coaches_select_policy" ON public.team_coaches
  FOR SELECT USING (
    -- Coaches can see their own assignments
    coach_id = auth.uid() OR 
    -- Team managers can see coaches for their teams
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid()) OR
    -- Allow coaches to check if they're already assigned (needed for join team)
    EXISTS (SELECT 1 FROM public.coaches WHERE id = auth.uid())
  );

-- Also ensure coaches can be inserted into teams
DROP POLICY IF EXISTS "team_coaches_insert_policy" ON public.team_coaches;

CREATE POLICY "team_coaches_insert_policy" ON public.team_coaches
  FOR INSERT WITH CHECK (
    -- Team managers can assign coaches to their teams
    (assigned_by = auth.uid() AND assigned_by IN (SELECT id FROM public.team_managers)) OR
    -- Allow system to assign coaches when they join teams
    (team_id IN (SELECT id FROM public.teams WHERE is_active = true))
  );

-- Update policy to allow coaches to update their own records
DROP POLICY IF EXISTS "team_coaches_update_policy" ON public.team_coaches;

CREATE POLICY "team_coaches_update_policy" ON public.team_coaches
  FOR UPDATE USING (
    -- Coaches can update their own assignments
    coach_id = auth.uid() OR
    -- Team managers can update coaches for their teams  
    assigned_by = auth.uid() OR
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  ); 