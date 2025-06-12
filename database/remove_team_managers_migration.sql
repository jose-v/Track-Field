-- Remove team_managers Dependencies Migration
-- Properly implements institution-centric team management using unified team_members system
-- Eliminates team_managers table and uses teams + team_members only

-- 1. Add institutional fields directly to teams table (not team_managers)
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS institution_type TEXT CHECK (institution_type IN ('high_school', 'middle_school', 'college', 'university', 'club', 'academy', 'other')) DEFAULT 'high_school',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS manager_title TEXT DEFAULT 'Athletic Director';

-- 2. Update teams.created_by to reference profiles directly (not team_managers)
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_created_by_fkey;
ALTER TABLE public.teams ADD CONSTRAINT teams_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Migrate existing team_managers data to teams table
UPDATE public.teams 
SET institution_name = tm.organization,
    institution_type = 'high_school' -- Default, can be updated later
FROM public.team_managers tm 
WHERE teams.created_by = tm.id AND teams.institution_name IS NULL;

-- 4. Update team_coaches.assigned_by to reference profiles directly
ALTER TABLE public.team_coaches DROP CONSTRAINT IF EXISTS team_coaches_assigned_by_fkey;
ALTER TABLE public.team_coaches ADD CONSTRAINT team_coaches_assigned_by_fkey 
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Create view for institutional profile (using teams + team_members, not team_managers)
CREATE OR REPLACE VIEW public.institutional_profile_view AS
SELECT
  t.created_by AS id,
  t.institution_name,
  t.institution_type,
  t.address,
  t.city,
  t.state,
  t.zip_code,
  t.phone,
  t.website,
  t.logo_url,
  t.established_year,
  t.description,
  t.manager_title,
  t.updated_at,
  -- Manager personal info (from profiles)
  p.first_name AS manager_first_name,
  p.last_name AS manager_last_name,
  p.email AS manager_email,
  p.phone AS manager_personal_phone,
  p.avatar_url AS manager_avatar,
  -- Team statistics (using team_members)
  COUNT(DISTINCT t.id) FILTER (WHERE t.is_active = true) AS team_count,
  COUNT(DISTINCT tm_athletes.user_id) AS total_athletes,
  COUNT(DISTINCT tm_coaches.user_id) AS total_coaches
FROM
  public.teams t
JOIN
  public.profiles p ON t.created_by = p.id
LEFT JOIN
  public.team_members tm_athletes ON t.id = tm_athletes.team_id 
  AND tm_athletes.role = 'athlete' AND tm_athletes.status = 'active'
LEFT JOIN
  public.team_members tm_coaches ON t.id = tm_coaches.team_id 
  AND tm_coaches.role = 'coach' AND tm_coaches.status = 'active'
WHERE
  p.role = 'team_manager' AND t.is_active = true
GROUP BY
  t.created_by, t.institution_name, t.institution_type, t.address, t.city, 
  t.state, t.zip_code, t.phone, t.website, t.logo_url, t.established_year, 
  t.description, t.manager_title, t.updated_at, p.first_name, p.last_name, 
  p.email, p.phone, p.avatar_url;

-- 6. Update RLS policies to use profiles instead of team_managers
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.profiles WHERE role = 'team_manager')
  );

DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.profiles WHERE role = 'team_manager')
  );

DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;
CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (
    auth.uid() = created_by AND
    created_by IN (SELECT id FROM public.profiles WHERE role = 'team_manager')
  );

-- 7. Update team_coaches RLS policies
DROP POLICY IF EXISTS "team_coaches_insert_policy" ON public.team_coaches;
CREATE POLICY "team_coaches_insert_policy" ON public.team_coaches
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid() AND
    assigned_by IN (SELECT id FROM public.profiles WHERE role = 'team_manager')
  );

DROP POLICY IF EXISTS "team_coaches_update_policy" ON public.team_coaches;
CREATE POLICY "team_coaches_update_policy" ON public.team_coaches
  FOR UPDATE USING (
    assigned_by = auth.uid() OR
    team_id IN (SELECT id FROM public.teams WHERE created_by = auth.uid())
  );

-- 8. Function to transfer team management (using profiles, not team_managers)
CREATE OR REPLACE FUNCTION transfer_team_management(
  old_manager_id UUID,
  new_manager_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Ensure new manager has team_manager role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_manager_id AND role = 'team_manager') THEN
    RAISE EXCEPTION 'New manager must have team_manager role in profiles';
  END IF;
  
  -- Transfer all teams to new manager
  UPDATE public.teams 
  SET created_by = new_manager_id 
  WHERE created_by = old_manager_id;
  
  -- Transfer team_coaches assignments
  UPDATE public.team_coaches 
  SET assigned_by = new_manager_id 
  WHERE assigned_by = old_manager_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions on new view
GRANT SELECT ON public.institutional_profile_view TO authenticated;

-- 10. Comments for documentation
COMMENT ON VIEW public.institutional_profile_view IS 'Institution-centric view using teams table with institutional fields. No longer depends on team_managers table.';
COMMENT ON FUNCTION transfer_team_management IS 'Transfers team management between team_manager profiles. Uses unified teams + team_members system.';

-- 11. TODO: After confirming this works, drop team_managers table
-- DROP TABLE IF EXISTS public.team_managers CASCADE;
-- (Commented out for safety - run manually after verification) 