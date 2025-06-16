-- Check current profile data for all users
-- This will show us exactly what roles are in the database vs what the frontend sees

SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  created_at,
  updated_at,
  CASE 
    WHEN role IS NULL THEN '🚨 NULL ROLE'
    WHEN role = '' THEN '🚨 EMPTY ROLE'
    WHEN role = 'coach' THEN '👨‍🏫 COACH'
    WHEN role = 'athlete' THEN '🏃‍♂️ ATHLETE'
    WHEN role = 'team_manager' THEN '👔 TEAM MANAGER'
    ELSE '❓ UNKNOWN: ' || role
  END as role_display
FROM profiles 
ORDER BY 
  CASE role 
    WHEN 'coach' THEN 1
    WHEN 'team_manager' THEN 2  
    WHEN 'athlete' THEN 3
    ELSE 4
  END,
  email;

-- Also check if any profiles were recently updated (potential timing issue)
SELECT 
  'Recent Updates' as info,
  COUNT(*) as count,
  string_agg(DISTINCT role, ', ') as roles_updated
FROM profiles 
WHERE updated_at > NOW() - INTERVAL '1 hour'; 