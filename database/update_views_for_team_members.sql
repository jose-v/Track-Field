-- Update Database Views for New Team Members System
-- This script updates existing views to use the team_members table

-- Updated Athletes View - Now includes team info from team_members
CREATE OR REPLACE VIEW public.athletes_view AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.first_name || ' ' || p.last_name AS full_name,
  p.phone,
  p.avatar_url,
  p.bio,
  a.date_of_birth,
  a.gender,
  a.events,
  -- Legacy team_id for backwards compatibility
  a.team_id,
  -- Primary team from team_members (first active team)
  tm_primary.team_id AS primary_team_id,
  t_primary.name AS primary_team_name,
  t_primary.team_type AS primary_team_type,
  -- Legacy team name for backwards compatibility
  t_legacy.name AS team_name,
  EXTRACT(YEAR FROM AGE(NOW(), a.date_of_birth)) AS age
FROM
  public.profiles p
JOIN
  public.athletes a ON p.id = a.id
-- Get primary team from team_members (first active membership)
LEFT JOIN LATERAL (
  SELECT team_id, joined_at
  FROM public.team_members tm
  WHERE tm.user_id = p.id 
    AND tm.role = 'athlete' 
    AND tm.status = 'active'
  ORDER BY tm.joined_at ASC
  LIMIT 1
) tm_primary ON true
LEFT JOIN public.teams t_primary ON tm_primary.team_id = t_primary.id
-- Legacy team for backwards compatibility
LEFT JOIN public.teams t_legacy ON a.team_id = t_legacy.id
WHERE
  p.role = 'athlete';

-- Updated Team with Athletes View - Now uses team_members
CREATE OR REPLACE VIEW public.team_athletes_view AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.description,
  t.team_type,
  t.invite_code,
  ARRAY_AGG(tm.user_id) FILTER (WHERE tm.user_id IS NOT NULL) AS athlete_ids,
  ARRAY_AGG(p.first_name || ' ' || p.last_name) FILTER (WHERE p.id IS NOT NULL) AS athlete_names,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'athlete') AS athlete_count,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'coach') AS coach_count,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'manager') AS manager_count,
  COUNT(tm.user_id) AS total_member_count
FROM
  public.teams t
LEFT JOIN
  public.team_members tm ON t.id = tm.team_id AND tm.status = 'active'
LEFT JOIN
  public.profiles p ON tm.user_id = p.id
GROUP BY
  t.id, t.name, t.description, t.team_type, t.invite_code;

-- New Team Members Detail View - Shows all team memberships with details
CREATE OR REPLACE VIEW public.team_members_detail_view AS
SELECT
  tm.id AS membership_id,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.status,
  tm.joined_at,
  tm.added_by_user_id,
  -- Team info
  t.name AS team_name,
  t.description AS team_description,
  t.team_type,
  t.invite_code,
  t.is_active AS team_active,
  -- User info
  p.first_name,
  p.last_name,
  p.first_name || ' ' || p.last_name AS full_name,
  p.email,
  p.avatar_url,
  p.role AS user_role,
  -- Added by info
  added_by.first_name || ' ' || added_by.last_name AS added_by_name,
  added_by.email AS added_by_email
FROM
  public.team_members tm
JOIN
  public.teams t ON tm.team_id = t.id
JOIN
  public.profiles p ON tm.user_id = p.id
LEFT JOIN
  public.profiles added_by ON tm.added_by_user_id = added_by.id
WHERE
  tm.status = 'active' AND t.is_active = true;

-- Updated Athletes with Personal Records View - Uses new team system
CREATE OR REPLACE VIEW public.athlete_records_view AS
SELECT
  a.id,
  a.full_name,
  a.primary_team_name AS team_name,
  a.primary_team_type AS team_type,
  e.name AS event_name,
  e.category AS event_category,
  pr.record_value,
  pr.record_date,
  pr.location
FROM
  public.athletes_view a
JOIN
  public.personal_records pr ON a.id = pr.athlete_id
JOIN
  public.events e ON pr.event_id = e.id
ORDER BY
  a.full_name, e.name, pr.record_date DESC;

-- New Team Statistics View - Comprehensive team stats
CREATE OR REPLACE VIEW public.team_stats_view AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.team_type,
  t.created_at AS team_created,
  -- Member counts by role
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'athlete' AND tm.status = 'active') AS active_athletes,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'coach' AND tm.status = 'active') AS active_coaches,
  COUNT(tm.user_id) FILTER (WHERE tm.role = 'manager' AND tm.status = 'active') AS active_managers,
  COUNT(tm.user_id) FILTER (WHERE tm.status = 'active') AS total_active_members,
  COUNT(tm.user_id) FILTER (WHERE tm.status = 'pending') AS pending_members,
  -- Recent activity
  MAX(tm.joined_at) AS last_member_joined,
  MIN(tm.joined_at) AS first_member_joined,
  -- Team age
  EXTRACT(DAYS FROM NOW() - t.created_at) AS team_age_days
FROM
  public.teams t
LEFT JOIN
  public.team_members tm ON t.id = tm.team_id
WHERE
  t.is_active = true
GROUP BY
  t.id, t.name, t.team_type, t.created_at;

-- Verification queries to test the new views
-- Uncomment these to test after running the migration

/*
-- Test the updated athletes_view
SELECT 'Updated athletes_view test' AS test_name;
SELECT id, full_name, primary_team_name, primary_team_type, team_name 
FROM public.athletes_view 
LIMIT 5;

-- Test the updated team_athletes_view  
SELECT 'Updated team_athletes_view test' AS test_name;
SELECT team_name, team_type, athlete_count, coach_count, total_member_count
FROM public.team_athletes_view
LIMIT 5;

-- Test the new team_members_detail_view
SELECT 'New team_members_detail_view test' AS test_name;
SELECT team_name, full_name, role, team_type, joined_at
FROM public.team_members_detail_view
LIMIT 5;

-- Test the new team_stats_view
SELECT 'New team_stats_view test' AS test_name;
SELECT team_name, team_type, active_athletes, active_coaches, total_active_members
FROM public.team_stats_view
LIMIT 5;
*/ 