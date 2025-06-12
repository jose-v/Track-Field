-- Auto-Create Coach Teams Migration
-- This script creates coach teams for existing coaches who have athletes but no teams

-- Step 1: Create coach teams for coaches who have athletes but no teams
INSERT INTO teams (name, description, team_type, invite_code, created_by, created_at)
SELECT 
  CONCAT(p.first_name, ' ', p.last_name, '''s Team') as name,
  CONCAT('Auto-created team for coach ', p.first_name, ' ', p.last_name) as description,
  'coach' as team_type,
  -- Generate a simple invite code (we'll update this with proper random codes)
  UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 6)) as invite_code,
  ca.coach_id as created_by,
  NOW() as created_at
FROM (
  -- Get coaches who have athletes but no coach teams
  SELECT DISTINCT ca.coach_id
  FROM coach_athletes ca
  AND ca.coach_id NOT IN (
    SELECT DISTINCT tm.user_id 
    FROM team_members tm 
    JOIN teams t ON tm.team_id = t.id 
    WHERE tm.role = 'coach' 
    AND tm.status = 'active' 
    AND t.team_type = 'coach'
  )
) ca
JOIN profiles p ON ca.coach_id = p.id;

-- Step 2: Add coaches as team members to their newly created teams
INSERT INTO team_members (team_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT 
  t.id as team_id,
  t.created_by as user_id,
  'coach' as role,
  'active' as status,
  t.created_at as joined_at,
  NOW() as created_at,
  NOW() as updated_at
FROM teams t
WHERE t.team_type = 'coach'
AND t.created_at >= NOW() - INTERVAL '1 minute' -- Only newly created teams
AND t.created_by NOT IN (
  SELECT user_id FROM team_members WHERE team_id = t.id
);

-- Step 3: Migrate athletes from coach_athletes to team_members
INSERT INTO team_members (team_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT 
  t.id as team_id,
  ca.athlete_id as user_id,
  'athlete' as role,
  'active' as status,
  ca.created_at as joined_at,
  NOW() as created_at,
  NOW() as updated_at
FROM coach_athletes ca
JOIN teams t ON ca.coach_id = t.created_by
AND t.team_type = 'coach'
AND t.created_at >= NOW() - INTERVAL '1 minute' -- Only newly created teams
AND NOT EXISTS (
  -- Don't duplicate if athlete is already in the team
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = ca.athlete_id 
  AND tm.status = 'active'
);

-- Step 4: Update athletes.team_id to point to the new coach team (for legacy compatibility)
UPDATE athletes 
SET team_id = t.id
FROM coach_athletes ca
JOIN teams t ON ca.coach_id = t.created_by
WHERE athletes.id = ca.athlete_id
AND t.team_type = 'coach'
AND t.created_at >= NOW() - INTERVAL '1 minute'
AND (athletes.team_id IS NULL OR athletes.team_id != t.id);

-- Step 5: Verification queries
SELECT 
  'Auto-created coach teams' as description,
  COUNT(*) as count
FROM teams 
WHERE team_type = 'coach' 
AND created_at >= NOW() - INTERVAL '1 minute';

SELECT 
  'Coach team memberships created' as description,
  COUNT(*) as count
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
WHERE t.team_type = 'coach'
AND tm.role = 'coach'
AND tm.created_at >= NOW() - INTERVAL '1 minute';

SELECT 
  'Athletes migrated to coach teams' as description,
  COUNT(*) as count
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
WHERE t.team_type = 'coach'
AND tm.role = 'athlete'
AND tm.created_at >= NOW() - INTERVAL '1 minute';

-- Step 6: Show sample results
SELECT 
  t.name as team_name,
  t.invite_code,
  p.first_name || ' ' || p.last_name as coach_name,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'athlete') as athlete_count
FROM teams t
JOIN profiles p ON t.created_by = p.id
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE t.team_type = 'coach'
AND t.created_at >= NOW() - INTERVAL '1 minute'
GROUP BY t.id, t.name, t.invite_code, p.first_name, p.last_name
ORDER BY t.created_at; 