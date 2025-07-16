-- Migration: Update existing warmup blocks to use 60s rest time instead of 30s
-- Date: 2024-12-30
-- Description: Fix existing workout blocks where warmup category has 30s rest, should be 60s

BEGIN;

-- Update existing block-based workouts where warmup blocks have restBetweenExercises = 30
UPDATE workouts 
SET blocks = (
    SELECT jsonb_agg(
        CASE 
            WHEN block->>'category' = 'warmup' AND (block->>'restBetweenExercises')::integer = 30
            THEN jsonb_set(block, '{restBetweenExercises}', '60'::jsonb)
            ELSE block
        END
    )
    FROM jsonb_array_elements(blocks) AS block
)
WHERE is_block_based = true 
  AND blocks IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(blocks) AS block 
    WHERE block->>'category' = 'warmup' 
      AND (block->>'restBetweenExercises')::integer = 30
  );

-- Log the number of affected workouts
WITH affected_workouts AS (
    SELECT COUNT(*) as workout_count,
           SUM(
               (SELECT COUNT(*) 
                FROM jsonb_array_elements(blocks) AS block 
                WHERE block->>'category' = 'warmup' 
                  AND (block->>'restBetweenExercises')::integer = 30)
           ) as warmup_blocks_count
    FROM workouts 
    WHERE is_block_based = true 
      AND blocks IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(blocks) AS block 
        WHERE block->>'category' = 'warmup' 
          AND (block->>'restBetweenExercises')::integer = 30
      )
)
SELECT 
    'Updated ' || workout_count || ' workouts with ' || warmup_blocks_count || ' warmup blocks from 30s to 60s rest time' as update_summary
FROM affected_workouts;

COMMIT; 