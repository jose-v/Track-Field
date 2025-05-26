-- Database Views for Track & Field Application
-- These views make it easier to query data from the application

-- Athletes View - Combines profile and athlete data
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
  a.birth_date,
  a.gender,
  a.events,
  a.team_id,
  t.name AS team_name,
  EXTRACT(YEAR FROM AGE(NOW(), a.birth_date)) AS age
FROM
  public.profiles p
JOIN
  public.athletes a ON p.id = a.id
LEFT JOIN
  public.teams t ON a.team_id = t.id
WHERE
  p.role = 'athlete';

-- Coaches View - Combines profile and coach data
CREATE OR REPLACE VIEW public.coaches_view AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.first_name || ' ' || p.last_name AS full_name,
  p.phone,
  p.avatar_url,
  p.bio,
  c.specialties,
  c.certifications
FROM
  public.profiles p
JOIN
  public.coaches c ON p.id = c.id
WHERE
  p.role = 'coach';

-- Team Managers View - Combines profile and manager data
CREATE OR REPLACE VIEW public.team_managers_view AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.first_name || ' ' || p.last_name AS full_name,
  p.phone,
  p.avatar_url,
  p.bio,
  tm.organization
FROM
  public.profiles p
JOIN
  public.team_managers tm ON p.id = tm.id
WHERE
  p.role = 'team_manager';

-- Coaches with Athletes View - Shows coaches with their assigned athletes
CREATE OR REPLACE VIEW public.coach_athletes_view AS
SELECT
  c.id AS coach_id,
  c.full_name AS coach_name,
  c.email AS coach_email,
  c.specialties,
  ARRAY_AGG(a.id) AS athlete_ids,
  ARRAY_AGG(a.full_name) AS athlete_names,
  COUNT(a.id) AS athlete_count
FROM
  public.coaches_view c
LEFT JOIN
  public.coach_athletes ca ON c.id = ca.coach_id
LEFT JOIN
  public.athletes_view a ON ca.athlete_id = a.id
GROUP BY
  c.id, c.full_name, c.email, c.specialties;

-- Team with Athletes View - Shows teams with their member athletes
CREATE OR REPLACE VIEW public.team_athletes_view AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.description,
  ARRAY_AGG(a.id) AS athlete_ids,
  ARRAY_AGG(p.first_name || ' ' || p.last_name) AS athlete_names,
  COUNT(a.id) AS athlete_count
FROM
  public.teams t
LEFT JOIN
  public.athletes a ON t.id = a.team_id
LEFT JOIN
  public.profiles p ON a.id = p.id
GROUP BY
  t.id, t.name, t.description;

-- Athletes with Personal Records View
CREATE OR REPLACE VIEW public.athlete_records_view AS
SELECT
  a.id,
  a.full_name,
  a.team_name,
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