-- Fix NULL Role Profiles - Emergency Database Cleanup
-- This script addresses the root cause of the "Profile found but role is NULL" issues

-- 1. Identify profiles with NULL roles
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at,
  'NULL_ROLE' as issue_type
FROM profiles 
WHERE role IS NULL 
ORDER BY created_at DESC;

-- 2. Check if these users have any role-specific data that can help determine their intended role
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  CASE 
    WHEN a.id IS NOT NULL THEN 'athlete'
    WHEN c.id IS NOT NULL THEN 'coach'
    WHEN tm.user_id IS NOT NULL THEN 'team_manager'
    ELSE 'unknown'
  END as detected_role,
  p.created_at
FROM profiles p
LEFT JOIN athletes a ON p.id = a.id
LEFT JOIN coaches c ON p.id = c.id
LEFT JOIN team_members tm ON p.id = tm.user_id AND tm.role = 'manager'
WHERE p.role IS NULL
ORDER BY p.created_at DESC;

-- 3. Fix profiles that have clear role indicators
-- Update athletes
UPDATE profiles 
SET role = 'athlete', updated_at = NOW()
WHERE role IS NULL 
  AND id IN (SELECT id FROM athletes);

-- Update coaches  
UPDATE profiles 
SET role = 'coach', updated_at = NOW()
WHERE role IS NULL 
  AND id IN (SELECT id FROM coaches);

-- Update team managers
UPDATE profiles 
SET role = 'team_manager', updated_at = NOW()
WHERE role IS NULL 
  AND id IN (
    SELECT DISTINCT user_id 
    FROM team_members 
    WHERE role = 'manager' AND status = 'active'
  );

-- 4. For remaining NULL role profiles, set them to 'athlete' as default
-- (This prevents the routing issues while allowing users to change their role later)
UPDATE profiles 
SET role = 'athlete', updated_at = NOW()
WHERE role IS NULL;

-- 5. Create missing role-specific profiles for any profiles that were just fixed
-- Create athlete profiles for users with athlete role but no athlete record
INSERT INTO athletes (id, date_of_birth, gender, events, team_id)
SELECT p.id, NULL, NULL, ARRAY[]::TEXT[], NULL
FROM profiles p
LEFT JOIN athletes a ON p.id = a.id
WHERE p.role = 'athlete' AND a.id IS NULL;

-- Create coach profiles for users with coach role but no coach record  
INSERT INTO coaches (id, specialties, certifications)
SELECT p.id, ARRAY[]::TEXT[], ARRAY[]::TEXT[]
FROM profiles p
LEFT JOIN coaches c ON p.id = c.id
WHERE p.role = 'coach' AND c.id IS NULL;

-- 6. Verification queries
SELECT 'After fix - profiles with NULL roles:' as status;
SELECT COUNT(*) as null_role_count FROM profiles WHERE role IS NULL;

SELECT 'Role distribution after fix:' as status;
SELECT role, COUNT(*) as count 
FROM profiles 
WHERE role IS NOT NULL 
GROUP BY role 
ORDER BY count DESC;

-- 7. Profiles that still need manual intervention
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at,
  'MANUAL_REVIEW_NEEDED' as status
FROM profiles 
WHERE role IS NULL;

-- 8. Completion status
SELECT 'Profile NULL role cleanup completed at: ' || NOW()::TEXT as completion_status; 