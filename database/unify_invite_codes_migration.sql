-- Unify Invite Code Systems Migration
-- Converts all teams to use 6-digit invite codes and unified team_members system
-- Run this in Supabase SQL Editor

-- 1. Create function to generate 6-digit invite codes
CREATE OR REPLACE FUNCTION generate_6_digit_invite_code() RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 2. Update all existing teams to use 6-digit invite codes
UPDATE public.teams 
SET invite_code = generate_6_digit_invite_code()
WHERE LENGTH(invite_code) != 6 OR invite_code IS NULL;

-- 3. Update the invite code generation function to use 6 digits by default
DROP FUNCTION IF EXISTS generate_team_invite_code();
CREATE OR REPLACE FUNCTION generate_team_invite_code() RETURNS TEXT AS $$
BEGIN
  RETURN generate_6_digit_invite_code();
END;
$$ LANGUAGE plpgsql;

-- 4. Migrate any existing team_coaches relationships to team_members
INSERT INTO public.team_members (team_id, user_id, role, status, joined_at, added_by_user_id)
SELECT 
  tc.team_id,
  tc.coach_id,
  'coach',
  CASE WHEN tc.is_active THEN 'active' ELSE 'inactive' END,
  tc.created_at,
  tc.assigned_by
FROM public.team_coaches tc
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 5. Migrate team managers to team_members as managers
INSERT INTO public.team_members (team_id, user_id, role, status, joined_at, added_by_user_id)
SELECT 
  t.id AS team_id,
  t.created_by AS user_id,
  'manager',
  'active',
  t.created_at,
  NULL
FROM public.teams t
WHERE t.created_by IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 6. Update team_invitations to use 6-digit codes
UPDATE public.team_invitations 
SET invite_code = (
  SELECT invite_code 
  FROM public.teams 
  WHERE teams.id = team_invitations.team_id
)
WHERE LENGTH(invite_code) != 6;

-- 7. Create unified team analytics view
CREATE OR REPLACE VIEW public.unified_team_analytics AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.description,
  t.team_type,
  t.invite_code,
  t.created_at,
  t.is_active,
  -- Member counts by role
  COUNT(CASE WHEN tm.role = 'athlete' AND tm.status = 'active' THEN 1 END) AS athlete_count,
  COUNT(CASE WHEN tm.role = 'coach' AND tm.status = 'active' THEN 1 END) AS coach_count,
  COUNT(CASE WHEN tm.role = 'manager' AND tm.status = 'active' THEN 1 END) AS manager_count,
  COUNT(CASE WHEN tm.status = 'active' THEN 1 END) AS total_active_members,
  -- Pending invitations
  (SELECT COUNT(*) FROM public.team_invitations ti 
   WHERE ti.team_id = t.id AND ti.status = 'pending') AS pending_invites
FROM
  public.teams t
LEFT JOIN
  public.team_members tm ON t.id = tm.team_id
WHERE
  t.is_active = true
GROUP BY
  t.id, t.name, t.description, t.team_type, t.invite_code, t.created_at, t.is_active;

-- 8. Update validation constraints for 6-digit codes
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_invite_code_format;
ALTER TABLE public.teams ADD CONSTRAINT teams_invite_code_format 
  CHECK (invite_code ~ '^[A-Z0-9]{6}$');

-- 9. Create function to join team by invite code (unified)
CREATE OR REPLACE FUNCTION join_team_by_invite_code(
  p_invite_code TEXT,
  p_user_id UUID,
  p_role TEXT DEFAULT 'athlete'
) RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_team_name TEXT;
  v_existing_member BOOLEAN;
  result JSON;
BEGIN
  -- Normalize invite code
  p_invite_code := upper(trim(p_invite_code));
  
  -- Validate role
  IF p_role NOT IN ('athlete', 'coach', 'manager') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;
  
  -- Find team by invite code
  SELECT id, name INTO v_team_id, v_team_name
  FROM public.teams
  WHERE invite_code = p_invite_code AND is_active = true;
  
  IF v_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM public.team_members 
    WHERE team_id = v_team_id AND user_id = p_user_id AND status = 'active'
  ) INTO v_existing_member;
  
  IF v_existing_member THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this team');
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role, status, joined_at)
  VALUES (v_team_id, p_user_id, p_role, 'active', NOW());
  
  RETURN json_build_object(
    'success', true, 
    'team_id', v_team_id,
    'team_name', v_team_name,
    'role', p_role
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 10. Verification queries
SELECT 'Migration Summary' AS info;

SELECT 
  'Teams with 6-digit codes' AS check_type,
  COUNT(*) AS count
FROM public.teams 
WHERE LENGTH(invite_code) = 6;

SELECT 
  'Team members by role' AS check_type,
  role,
  COUNT(*) AS count
FROM public.team_members
WHERE status = 'active'
GROUP BY role;

SELECT 
  'Teams by type' AS check_type,
  team_type,
  COUNT(*) AS count
FROM public.teams
WHERE is_active = true
GROUP BY team_type;

-- Sample of unified analytics
SELECT * FROM public.unified_team_analytics LIMIT 5;

COMMIT; 