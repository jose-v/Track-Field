-- Institution-Centric Team Manager Migration
-- Makes team manager portal represent the institution/school rather than individual managers
-- Supports manager transitions while maintaining institutional continuity

-- 1. Extend team_managers table with institutional fields
ALTER TABLE public.team_managers 
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
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS manager_title TEXT DEFAULT 'Athletic Director',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_team_managers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for updated_at
DROP TRIGGER IF EXISTS team_managers_updated_at_trigger ON public.team_managers;
CREATE TRIGGER team_managers_updated_at_trigger
  BEFORE UPDATE ON public.team_managers
  FOR EACH ROW
  EXECUTE FUNCTION update_team_managers_updated_at();

-- 4. Update existing team_managers to use organization as institution_name
UPDATE public.team_managers 
SET institution_name = COALESCE(organization, 'Unnamed Institution')
WHERE institution_name IS NULL;

-- 5. Create view for institutional profile display
CREATE OR REPLACE VIEW public.institutional_profile_view AS
SELECT
  tm.id,
  tm.institution_name,
  tm.institution_type,
  tm.address,
  tm.city,
  tm.state,
  tm.zip_code,
  tm.phone,
  tm.website,
  tm.logo_url,
  tm.established_year,
  tm.description,
  tm.manager_title,
  tm.updated_at,
  -- Manager personal info (for contact purposes)
  p.first_name AS manager_first_name,
  p.last_name AS manager_last_name,
  p.email AS manager_email,
  p.phone AS manager_personal_phone,
  p.avatar_url AS manager_avatar,
  -- Team statistics
  (SELECT COUNT(*) FROM public.teams t WHERE t.created_by = tm.id AND t.is_active = true) AS team_count,
  (SELECT COUNT(*) FROM public.team_members tmem 
   JOIN public.teams t ON tmem.team_id = t.id 
   WHERE t.created_by = tm.id AND tmem.status = 'active' AND tmem.role = 'athlete') AS total_athletes,
  (SELECT COUNT(*) FROM public.team_members tmem 
   JOIN public.teams t ON tmem.team_id = t.id 
   WHERE t.created_by = tm.id AND tmem.status = 'active' AND tmem.role = 'coach') AS total_coaches
FROM
  public.team_managers tm
JOIN
  public.profiles p ON tm.id = p.id
WHERE
  p.role = 'team_manager';

-- 6. Create function to transfer team manager role (for manager transitions)
CREATE OR REPLACE FUNCTION transfer_team_manager_role(
  old_manager_id UUID,
  new_manager_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  institution_data RECORD;
BEGIN
  -- Get current institutional data
  SELECT * INTO institution_data 
  FROM public.team_managers 
  WHERE id = old_manager_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Old manager not found';
  END IF;
  
  -- Ensure new manager has a profile
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_manager_id AND role = 'team_manager') THEN
    RAISE EXCEPTION 'New manager must have a team_manager profile';
  END IF;
  
  -- Create new team manager record with same institutional data
  INSERT INTO public.team_managers (
    id, institution_name, institution_type, address, city, state, 
    zip_code, phone, website, logo_url, established_year, 
    description, manager_title, organization
  ) VALUES (
    new_manager_id, institution_data.institution_name, institution_data.institution_type,
    institution_data.address, institution_data.city, institution_data.state,
    institution_data.zip_code, institution_data.phone, institution_data.website,
    institution_data.logo_url, institution_data.established_year,
    institution_data.description, institution_data.manager_title, institution_data.organization
  );
  
  -- Update all teams to point to new manager
  UPDATE public.teams 
  SET created_by = new_manager_id 
  WHERE created_by = old_manager_id;
  
  -- Archive old manager record (don't delete to maintain history)
  UPDATE public.team_managers 
  SET organization = organization || ' (TRANSFERRED)', updated_at = NOW()
  WHERE id = old_manager_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Update RLS policies to support institutional view
DROP POLICY IF EXISTS "team_managers_update_policy" ON public.team_managers;
CREATE POLICY "team_managers_update_policy" ON public.team_managers
  FOR UPDATE USING (id = auth.uid());

-- 8. Grant permissions on new view
GRANT SELECT ON public.institutional_profile_view TO authenticated;

-- 9. Comment for documentation
COMMENT ON TABLE public.team_managers IS 'Represents institutional team management accounts. The institution_name is the primary identifier, while the manager (id) is the current person managing the account.';
COMMENT ON FUNCTION transfer_team_manager_role IS 'Transfers team manager role from one person to another while preserving institutional identity and team ownership.'; 