-- Quick fix for test users - restore correct roles based on existing data
-- This will fix any users that got incorrectly set to 'athlete'

-- 1. Fix users who should be coaches (have coach data but wrong role)
UPDATE profiles 
SET role = 'coach', updated_at = NOW()
WHERE id IN (SELECT id FROM coaches)
  AND (role != 'coach' OR role IS NULL);

-- 2. Fix users who should be team managers (have team member manager data but wrong role)  
UPDATE profiles 
SET role = 'team_manager', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM team_members 
  WHERE role = 'manager' AND status = 'active'
)
AND (role != 'team_manager' OR role IS NULL);

-- 3. Fix users who should be athletes (have athlete data but wrong role)
UPDATE profiles 
SET role = 'athlete', updated_at = NOW()
WHERE id IN (SELECT id FROM athletes)
  AND (role != 'athlete' OR role IS NULL);

-- 4. Show results
SELECT 'Role correction results:' as status;

SELECT 
  role,
  COUNT(*) as count,
  'profiles' as table_name
FROM profiles 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY count DESC;

-- 5. Check for any remaining issues
SELECT 
  p.id,
  p.email,
  p.role,
  CASE 
    WHEN a.id IS NOT NULL THEN 'Has athlete data'
    ELSE 'No athlete data'
  END as athlete_data,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Has coach data' 
    ELSE 'No coach data'
  END as coach_data,
  CASE 
    WHEN tm.user_id IS NOT NULL THEN 'Has manager data'
    ELSE 'No manager data'
  END as manager_data
FROM profiles p
LEFT JOIN athletes a ON p.id = a.id
LEFT JOIN coaches c ON p.id = c.id  
LEFT JOIN team_members tm ON p.id = tm.user_id AND tm.role = 'manager'
ORDER BY p.created_at DESC
LIMIT 10; 