-- Debug: Check current user profile and role data
-- Run this to see what's actually in the database for the user experiencing the issue

-- 1. Find the most recent profiles that might have issues
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at,
  CASE 
    WHEN role IS NULL THEN 'NULL_ROLE'
    WHEN role = '' THEN 'EMPTY_ROLE'
    ELSE 'HAS_ROLE'
  END as role_status
FROM profiles 
WHERE email LIKE '%josev%' OR email LIKE '%hello%' 
   OR created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check for any role-specific data for these users
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  CASE 
    WHEN a.id IS NOT NULL THEN 'Has athlete data'
    ELSE 'No athlete data'
  END as athlete_status,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Has coach data'
    ELSE 'No coach data'
  END as coach_status
FROM profiles p
LEFT JOIN athletes a ON p.id = a.id
LEFT JOIN coaches c ON p.id = c.id
WHERE p.email LIKE '%josev%' OR p.email LIKE '%hello%'
   OR p.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC;

-- 3. Count of profiles by role status
SELECT 
  CASE 
    WHEN role IS NULL THEN 'NULL'
    WHEN role = '' THEN 'EMPTY'
    WHEN role = 'athlete' THEN 'ATHLETE'
    WHEN role = 'coach' THEN 'COACH'
    WHEN role = 'team_manager' THEN 'TEAM_MANAGER'
    ELSE 'OTHER'
  END as role_category,
  COUNT(*) as count
FROM profiles
GROUP BY 
  CASE 
    WHEN role IS NULL THEN 'NULL'
    WHEN role = '' THEN 'EMPTY'
    WHEN role = 'athlete' THEN 'ATHLETE'
    WHEN role = 'coach' THEN 'COACH'
    WHEN role = 'team_manager' THEN 'TEAM_MANAGER'
    ELSE 'OTHER'
  END
ORDER BY count DESC; 