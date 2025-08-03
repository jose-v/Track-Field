-- Compare schemas of exercise_results and exercise_results_history tables
-- This will show us all the missing columns that need to be added

-- Get columns from exercise_results table
WITH live_columns AS (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'exercise_results' 
  AND table_schema = 'public'
),
history_columns AS (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'exercise_results_history' 
  AND table_schema = 'public'
)

-- Show columns that exist in live table but not in history table
SELECT 
  'MISSING IN HISTORY' as status,
  lc.column_name,
  lc.data_type,
  lc.is_nullable
FROM live_columns lc
LEFT JOIN history_columns hc ON lc.column_name = hc.column_name
WHERE hc.column_name IS NULL

UNION ALL

-- Show columns that exist in history table but not in live table
SELECT 
  'EXTRA IN HISTORY' as status,
  hc.column_name,
  hc.data_type,
  hc.is_nullable
FROM history_columns hc
LEFT JOIN live_columns lc ON hc.column_name = lc.column_name
WHERE lc.column_name IS NULL

UNION ALL

-- Show matching columns
SELECT 
  'MATCHING' as status,
  lc.column_name,
  lc.data_type,
  lc.is_nullable
FROM live_columns lc
INNER JOIN history_columns hc ON lc.column_name = hc.column_name

ORDER BY status, column_name; 