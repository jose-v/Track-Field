-- Fix athlete team data inconsistencies
-- This script ensures athletes only appear for the correct coaches/teams

-- First, let's see what we're working with
SELECT 'Current athletes table data:' as info;
SELECT a.id, p.first_name, p.last_name, a.team_id, t.name as team_name
FROM athletes a
JOIN profiles p ON a.id = p.id
LEFT JOIN teams t ON a.team_id = t.id
WHERE p.role = 'athlete';

SELECT 'Current coach_athletes relationships:' as info;
SELECT ca.coach_id, ca.athlete_id, ca.approval_status, 
       pc.first_name as coach_name, pa.first_name as athlete_name
FROM coach_athletes ca
JOIN profiles pc ON ca.coach_id = pc.id
JOIN profiles pa ON ca.athlete_id = pa.id;

-- Problem Analysis:
-- If an athlete has team_id set in athletes table, they will show up for ALL team managers
-- If an athlete has coach_athletes relationships, they will show up for those specific coaches
-- This creates duplicate visibility

-- Solution: Clean up the data model
-- Option 1: Remove team_id from athletes table for athletes who have coach relationships
UPDATE athletes 
SET team_id = NULL 
WHERE id IN (
  SELECT DISTINCT athlete_id 
  FROM coach_athletes 
  WHERE approval_status = 'approved'
);

-- Option 2: Or, remove coach_athletes relationships for athletes who have team_id
-- (Comment out one of these approaches)
/*
DELETE FROM coach_athletes 
WHERE athlete_id IN (
  SELECT id 
  FROM athletes 
  WHERE team_id IS NOT NULL
);
*/

-- Verify the cleanup
SELECT 'After cleanup - Athletes with team_id:' as info;
SELECT a.id, p.first_name, p.last_name, a.team_id, t.name as team_name
FROM athletes a
JOIN profiles p ON a.id = p.id
LEFT JOIN teams t ON a.team_id = t.id
WHERE p.role = 'athlete' AND a.team_id IS NOT NULL;

SELECT 'After cleanup - Coach-athlete relationships:' as info;
SELECT ca.coach_id, ca.athlete_id, ca.approval_status, 
       pc.first_name as coach_name, pa.first_name as athlete_name
FROM coach_athletes ca
JOIN profiles pc ON ca.coach_id = pc.id
JOIN profiles pa ON ca.athlete_id = pa.id
WHERE ca.approval_status = 'approved';

-- Additional cleanup: Ensure an athlete can only be coached by one coach at a time
-- Remove duplicate coach assignments (keep the most recent one)
WITH ranked_assignments AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY athlete_id ORDER BY created_at DESC) as rn
  FROM coach_athletes
  WHERE approval_status = 'approved'
)
DELETE FROM coach_athletes
WHERE id IN (
  SELECT id FROM ranked_assignments WHERE rn > 1
); 