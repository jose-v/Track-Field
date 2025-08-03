-- Create unified view for analytics that includes both active and archived workouts
-- This view is for analytics/reporting only, NOT for workout execution

CREATE OR REPLACE VIEW workouts_for_analytics AS
SELECT 
  id,
  name,
  description,
  type,
  date::TEXT,
  time,
  duration,
  location,
  exercises,
  blocks,
  is_block_based,
  block_version,
  is_template,
  template_type,
  user_id,
  created_by,
  created_at,
  updated_at,
  deleted_at,
  deleted_by,
  'active' as source,
  NULL as archived_at,
  NULL as archived_by,
  NULL as original_workout_id
FROM workouts 
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  original_workout_id as id,
  name,
  description,
  type,
  date,
  time,
  duration,
  location,
  exercises,
  blocks,
  is_block_based,
  block_version,
  is_template,
  template_type,
  user_id,
  created_by,
  created_at,
  updated_at,
  deleted_at,
  deleted_by,
  'archived' as source,
  archived_at,
  archived_by,
  id as original_workout_id
FROM workout_history;

-- Create indexes for better performance on the view
CREATE INDEX IF NOT EXISTS idx_workouts_analytics_user_id ON workouts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workouts_analytics_created_at ON workouts(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_created_at ON workout_history(created_at);

-- Add RLS policies for the view
-- Note: Views inherit RLS from underlying tables, but we can add additional policies if needed

-- Grant access to authenticated users
GRANT SELECT ON workouts_for_analytics TO authenticated;

-- Add comment explaining the purpose
COMMENT ON VIEW workouts_for_analytics IS 'Unified view for analytics that includes both active and archived workouts. Use for reports, dashboards, and analytics only. Do NOT use for workout execution.'; 