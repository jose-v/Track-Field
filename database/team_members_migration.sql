-- Team Members Migration - Phase 1
-- Implements hybrid team model with multiple team memberships
-- Run this in Supabase SQL Editor

-- 1. Create team_members table for many-to-many relationships
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'coach', 'manager')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  added_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 2. Add 'coach' to team_type if not already present
-- First check if the constraint exists and what values it allows
DO $$
BEGIN
  -- Try to add 'coach' to the team_type constraint
  BEGIN
    ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
    ALTER TABLE public.teams ADD CONSTRAINT teams_team_type_check 
      CHECK (team_type IN ('school', 'club', 'independent', 'other', 'coach'));
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update team_type constraint: %', SQLERRM;
  END;
END $$;

-- 3. Backfill team_members with existing data from athletes.team_id
INSERT INTO public.team_members (team_id, user_id, role, status, joined_at, added_by_user_id)
SELECT 
  a.team_id, 
  a.id, 
  'athlete', 
  'active', 
  COALESCE(a.created_at, NOW()), -- Use athlete creation date or now
  NULL -- No added_by for legacy data
FROM public.athletes a
WHERE a.team_id IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING; -- Avoid duplicates if run multiple times

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- 5. Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for team_members
-- Allow users to view team memberships
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (true);

-- Allow users to insert their own memberships (for join flows)
CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT tm.user_id FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Allow team managers and coaches to update memberships in their teams
CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT tm.user_id FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- Allow team managers and coaches to delete memberships in their teams
CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT tm.user_id FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.role IN ('coach', 'manager') 
      AND tm.status = 'active'
    )
  );

-- 7. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at_trigger
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- 8. Create view for easy team member queries
CREATE OR REPLACE VIEW public.team_members_view AS
SELECT
  tm.id,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.joined_at,
  tm.added_by_user_id,
  -- Team info
  t.name AS team_name,
  t.description AS team_description,
  t.team_type,
  t.invite_code,
  -- User info
  p.first_name,
  p.last_name,
  p.first_name || ' ' || p.last_name AS full_name,
  p.email,
  p.avatar_url,
  -- Added by info
  added_by.first_name || ' ' || added_by.last_name AS added_by_name
FROM
  public.team_members tm
JOIN
  public.teams t ON tm.team_id = t.id
JOIN
  public.profiles p ON tm.user_id = p.id
LEFT JOIN
  public.profiles added_by ON tm.added_by_user_id = added_by.id
WHERE
  tm.status = 'active' AND t.is_active = true;

-- 9. Verification queries (run these to check the migration)
-- Check backfilled data
SELECT 
  'Backfilled team members' AS info,
  COUNT(*) AS count
FROM public.team_members;

-- Check team types
SELECT 
  'Teams by type' AS info,
  team_type,
  COUNT(*) AS count
FROM public.teams
GROUP BY team_type;

-- Check athletes with teams
SELECT 
  'Athletes with teams (legacy)' AS info,
  COUNT(*) AS count
FROM public.athletes
WHERE team_id IS NOT NULL;

-- Sample team members view
SELECT 
  'Sample team members' AS info,
  team_name,
  full_name,
  role,
  team_type
FROM public.team_members_view
LIMIT 5;

COMMIT; 