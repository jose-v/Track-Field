-- Audit all users, their roles, and role-specific data

SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  CASE WHEN c.id IS NOT NULL THEN '✅' ELSE '❌' END as has_coach_record,
  CASE WHEN a.id IS NOT NULL THEN '✅' ELSE '❌' END as has_athlete_record,
  CASE WHEN tm.user_id IS NOT NULL AND tm.role = 'manager' THEN '✅' ELSE '❌' END as has_manager_record,
  p.created_at,
  p.updated_at
FROM profiles p
LEFT JOIN coaches c ON p.id = c.id
LEFT JOIN athletes a ON p.id = a.id
LEFT JOIN team_members tm ON p.id = tm.user_id AND tm.role = 'manager'
ORDER BY p.email;

-- Highlight mismatches
SELECT 
  p.email,
  p.role as profile_role,
  CASE 
    WHEN p.role = 'coach' AND c.id IS NULL THEN '❌ Coach missing coach record'
    WHEN p.role = 'athlete' AND a.id IS NULL THEN '❌ Athlete missing athlete record'
    WHEN p.role = 'team_manager' AND (tm.user_id IS NULL OR tm.role != 'manager') THEN '❌ Team manager missing manager record'
    ELSE '✅ OK' 
  END as status
FROM profiles p
LEFT JOIN coaches c ON p.id = c.id
LEFT JOIN athletes a ON p.id = a.id
LEFT JOIN team_members tm ON p.id = tm.user_id AND tm.role = 'manager'
ORDER BY p.email; 