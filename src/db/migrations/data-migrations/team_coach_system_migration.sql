-- Team-Coach System Enhancement Migration
-- Adds support for team-coach relationships and invite system
-- Supports both institutional teams and independent coaches

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add invite code and created_by to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.team_managers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_type TEXT CHECK (team_type IN ('school', 'club', 'independent', 'other')) DEFAULT 'school',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create team_coaches table for team-coach relationships
CREATE TABLE IF NOT EXISTS public.team_coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.team_managers(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('head_coach', 'assistant_coach', 'specialist', 'volunteer')) DEFAULT 'assistant_coach',
  specialties TEXT[], -- What they coach within the team
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(team_id, coach_id)
);

-- Create team invitations table for managing invites
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_role TEXT CHECK (invitee_role IN ('athlete', 'coach', 'team_manager')) NOT NULL,
  invite_code TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ
);

-- Add approval workflow enhancements to existing coach_athletes table
ALTER TABLE public.coach_athletes 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON public.teams(invite_code);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON public.teams(team_type);
CREATE INDEX IF NOT EXISTS idx_team_coaches_team_id ON public.team_coaches(team_id);
CREATE INDEX IF NOT EXISTS idx_team_coaches_coach_id ON public.team_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invite_code ON public.team_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_email ON public.team_invitations(invitee_email);

-- Enhanced view for teams with coach information
CREATE OR REPLACE VIEW public.team_coaches_view AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.description AS team_description,
  t.team_type,
  t.invite_code,
  t.is_active AS team_active,
  tc.id AS team_coach_id,
  tc.role AS coach_role,
  tc.specialties AS coach_specialties,
  tc.is_active AS coach_active,
  c.id AS coach_id,
  p.first_name || ' ' || p.last_name AS coach_name,
  p.email AS coach_email,
  p.avatar_url AS coach_avatar,
  c.specialties AS coach_all_specialties,
  c.certifications AS coach_certifications
FROM
  public.teams t
LEFT JOIN
  public.team_coaches tc ON t.id = tc.team_id AND tc.is_active = true
LEFT JOIN
  public.coaches c ON tc.coach_id = c.id
LEFT JOIN
  public.profiles p ON c.id = p.id
WHERE
  t.is_active = true;

-- Enhanced view for team management
CREATE OR REPLACE VIEW public.team_management_view AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.description,
  t.team_type,
  t.invite_code,
  t.created_at AS team_created,
  -- Team Manager Info
  tm.id AS manager_id,
  pm.first_name || ' ' || pm.last_name AS manager_name,
  pm.email AS manager_email,
  tm.organization,
  -- Team Stats
  (SELECT COUNT(*) FROM public.team_coaches tc WHERE tc.team_id = t.id AND tc.is_active = true) AS coach_count,
  (SELECT COUNT(*) FROM public.athletes a WHERE a.team_id = t.id) AS athlete_count,
  (SELECT COUNT(*) FROM public.team_invitations ti WHERE ti.team_id = t.id AND ti.status = 'pending') AS pending_invites
FROM
  public.teams t
LEFT JOIN
  public.team_managers tm ON t.created_by = tm.id
LEFT JOIN
  public.profiles pm ON tm.id = pm.id
WHERE
  t.is_active = true;

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_team_invite_code() RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create independent coach team
CREATE OR REPLACE FUNCTION create_independent_coach_team(
  coach_profile_id UUID,
  team_name TEXT,
  team_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
  new_manager_id UUID;
BEGIN
  -- Create team manager entry for the coach
  INSERT INTO public.team_managers (id, organization)
  VALUES (coach_profile_id, 'Independent Coach')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create the team
  INSERT INTO public.teams (name, description, created_by, team_type, invite_code)
  VALUES (team_name, team_description, coach_profile_id, 'independent', generate_team_invite_code())
  RETURNING id INTO new_team_id;
  
  -- Add coach to their own team
  INSERT INTO public.team_coaches (team_id, coach_id, assigned_by, role)
  VALUES (new_team_id, coach_profile_id, coach_profile_id, 'head_coach');
  
  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for new tables
ALTER TABLE public.team_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS for team_coaches - coaches can see their assignments, team managers can see their team's coaches
CREATE POLICY "team_coaches_select_policy" ON public.team_coaches
  FOR SELECT USING (
    coach_id = auth.uid() OR 
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  );

CREATE POLICY "team_coaches_insert_policy" ON public.team_coaches
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid() AND
    assigned_by IN (SELECT id FROM public.team_managers)
  );

CREATE POLICY "team_coaches_update_policy" ON public.team_coaches
  FOR UPDATE USING (
    assigned_by = auth.uid() OR
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  );

-- RLS for team_invitations - team managers can manage invites for their teams
CREATE POLICY "team_invitations_select_policy" ON public.team_invitations
  FOR SELECT USING (
    invited_by = auth.uid() OR
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  );

CREATE POLICY "team_invitations_insert_policy" ON public.team_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  );

-- Add comments for documentation
COMMENT ON TABLE public.team_coaches IS 'Manages coach assignments to teams with roles and specialties';
COMMENT ON TABLE public.team_invitations IS 'Manages invitations to join teams for athletes, coaches, and managers';
COMMENT ON COLUMN public.teams.invite_code IS 'Unique code for joining the team';
COMMENT ON COLUMN public.teams.team_type IS 'Type of team: school, club, independent coach, or other';
COMMENT ON COLUMN public.team_coaches.role IS 'Coach role within the team: head_coach, assistant_coach, specialist, volunteer';
COMMENT ON FUNCTION create_independent_coach_team IS 'Creates a team for an independent coach and assigns them as head coach and manager'; 