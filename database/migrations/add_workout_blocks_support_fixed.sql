-- Migration: Add workout blocks support (Fixed Version)
-- Date: 2024
-- Description: Add blocks column and related fields to support the new block-based workout system

BEGIN;

-- Add blocks column to store block-based workouts
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;

-- Add flag to indicate if this is a block-based workout (for backwards compatibility)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS is_block_based BOOLEAN DEFAULT FALSE;

-- Add additional fields for enhanced block functionality
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS block_version INTEGER DEFAULT 1;

-- Add composite index for block-based queries
CREATE INDEX IF NOT EXISTS idx_workouts_block_based ON workouts(is_block_based, user_id) WHERE is_block_based = true;

-- Add index for blocks JSONB queries (for performance)
CREATE INDEX IF NOT EXISTS idx_workouts_blocks_gin ON workouts USING GIN (blocks) WHERE blocks IS NOT NULL;

-- Create function to auto-migrate legacy workouts to blocks format
CREATE OR REPLACE FUNCTION migrate_workout_to_blocks(workout_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    workout_record RECORD;
    default_block JSONB;
BEGIN
    -- Get the workout record
    SELECT * INTO workout_record FROM workouts WHERE id = workout_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Skip if already migrated
    IF workout_record.is_block_based = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Create default block from existing exercises
    default_block := jsonb_build_object(
        'id', 'migrated-' || workout_record.id,
        'name', 'Main Workout',
        'exercises', COALESCE(workout_record.exercises, '[]'::jsonb),
        'flow', COALESCE(workout_record.flow_type, 'sequential'),
        'rounds', COALESCE(workout_record.circuit_rounds, 1),
        'category', 'main',
        'restBetweenExercises', 60
    );
    
    -- Update the workout with blocks format
    UPDATE workouts 
    SET 
        blocks = jsonb_build_array(default_block),
        is_block_based = TRUE,
        block_version = 1
    WHERE id = workout_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get category display name
CREATE OR REPLACE FUNCTION get_category_display_name(category TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE category
        WHEN 'warmup' THEN 'Warm-up'
        WHEN 'main' THEN 'Main Set'
        WHEN 'conditioning' THEN 'Conditioning'
        WHEN 'accessory' THEN 'Accessory Work'
        WHEN 'cooldown' THEN 'Cool-down'
        ELSE 'Workout'
    END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get rest time for category
CREATE OR REPLACE FUNCTION get_category_rest_time(category TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE category
        WHEN 'warmup' THEN 30
        WHEN 'main' THEN 90
        WHEN 'conditioning' THEN 75
        WHEN 'accessory' THEN 60
        WHEN 'cooldown' THEN 30
        ELSE 60
    END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to detect exercise category
CREATE OR REPLACE FUNCTION detect_exercise_category(exercise JSONB)
RETURNS TEXT AS $$
DECLARE
    detected_category TEXT := 'main';
    exercise_name TEXT;
BEGIN
    -- First check the actual category field from exercise library
    IF exercise ? 'category' AND exercise ->> 'category' IS NOT NULL THEN
        CASE LOWER(exercise ->> 'category')
            WHEN 'warm_up' THEN detected_category := 'warmup';
            WHEN 'cool_down' THEN detected_category := 'cooldown';
            WHEN 'accessory' THEN detected_category := 'accessory';
            WHEN 'cardio' THEN detected_category := 'conditioning';
            ELSE 
                -- Check if category contains keywords
                IF LOWER(exercise ->> 'category') ~ '.*(warm).*' THEN
                    detected_category := 'warmup';
                ELSIF LOWER(exercise ->> 'category') ~ '.*(cool|conditioning).*' THEN
                    detected_category := 'cooldown';
                ELSIF LOWER(exercise ->> 'category') ~ '.*(accessory|auxiliary).*' THEN
                    detected_category := 'accessory';
                ELSIF LOWER(exercise ->> 'category') ~ '.*(cardio|conditioning).*' THEN
                    detected_category := 'conditioning';
                END IF;
        END CASE;
    END IF;
    
    -- Fall back to name-based detection only if category didn't match
    IF detected_category = 'main' THEN
        exercise_name := LOWER(COALESCE(exercise ->> 'name', ''));
        IF exercise_name ~ '.*(warm|stretch|dynamic|activation).*' THEN
            detected_category := 'warmup';
        ELSIF exercise_name ~ '.*(cool|recovery|static stretch).*' THEN
            detected_category := 'cooldown';
        ELSIF exercise_name ~ '.*(accessory|auxiliary|supplemental).*' THEN
            detected_category := 'accessory';
        END IF;
    END IF;
    
    RETURN detected_category;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-detect and create intelligent blocks
CREATE OR REPLACE FUNCTION auto_create_workout_blocks(exercises JSONB)
RETURNS JSONB AS $$
DECLARE
    blocks JSONB := '[]'::jsonb;
    current_block JSONB;
    current_exercises JSONB := '[]'::jsonb;
    current_category TEXT := 'main';
    exercise JSONB;
    detected_category TEXT;
    block_counter INTEGER := 1;
    block_name TEXT;
    rest_time INTEGER;
BEGIN
    -- If no exercises, return single default block
    IF jsonb_array_length(exercises) = 0 THEN
        RETURN jsonb_build_array(
            jsonb_build_object(
                'id', 'default-block',
                'name', 'Main Workout', 
                'exercises', '[]'::jsonb,
                'flow', 'sequential',
                'category', 'main',
                'restBetweenExercises', 60
            )
        );
    END IF;
    
    -- Iterate through exercises to detect categories
    FOR i IN 0..jsonb_array_length(exercises) - 1 LOOP
        exercise := exercises -> i;
        detected_category := detect_exercise_category(exercise);
        
        -- If category changes, create new block
        IF detected_category != current_category AND jsonb_array_length(current_exercises) > 0 THEN
            block_name := get_category_display_name(current_category);
            rest_time := get_category_rest_time(current_category);
            
            current_block := jsonb_build_object(
                'id', 'block-' || block_counter,
                'name', block_name,
                'exercises', current_exercises,
                'flow', 'sequential',
                'category', current_category,
                'restBetweenExercises', rest_time
            );
            
            blocks := blocks || jsonb_build_array(current_block);
            current_exercises := '[]'::jsonb;
            block_counter := block_counter + 1;
        END IF;
        
        current_category := detected_category;
        current_exercises := current_exercises || jsonb_build_array(exercise);
    END LOOP;
    
    -- Add final block
    IF jsonb_array_length(current_exercises) > 0 THEN
        block_name := get_category_display_name(current_category);
        rest_time := get_category_rest_time(current_category);
        
        current_block := jsonb_build_object(
            'id', 'block-' || block_counter,
            'name', block_name,
            'exercises', current_exercises,
            'flow', 'sequential',
            'category', current_category,
            'restBetweenExercises', rest_time
        );
        
        blocks := blocks || jsonb_build_array(current_block);
    END IF;
    
    -- If no blocks created, create default
    IF jsonb_array_length(blocks) = 0 THEN
        blocks := jsonb_build_array(
            jsonb_build_object(
                'id', 'default-block',
                'name', 'Main Workout',
                'exercises', exercises,
                'flow', 'sequential',
                'category', 'main',
                'restBetweenExercises', 60
            )
        );
    END IF;
    
    RETURN blocks;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy block-based workout queries
CREATE OR REPLACE VIEW workout_blocks_view AS
SELECT 
    w.id,
    w.name,
    w.description,
    w.type,
    w.date,
    w.time,
    w.duration,
    w.location,
    w.user_id,
    w.created_by,
    w.created_at,
    w.is_block_based,
    w.blocks,
    -- Computed fields for backwards compatibility
    CASE 
        WHEN w.is_block_based = TRUE AND w.blocks IS NOT NULL THEN
            (SELECT jsonb_agg(exercise) 
             FROM (
                 SELECT jsonb_array_elements(block -> 'exercises') as exercise
                 FROM jsonb_array_elements(w.blocks) as block
             ) t)
        ELSE w.exercises
    END as computed_exercises,
    -- Block count
    CASE 
        WHEN w.is_block_based = TRUE AND w.blocks IS NOT NULL THEN
            jsonb_array_length(w.blocks)
        ELSE 0
    END as block_count,
    -- Total exercise count across all blocks
    CASE 
        WHEN w.is_block_based = TRUE AND w.blocks IS NOT NULL THEN
            (SELECT SUM(jsonb_array_length(block -> 'exercises'))
             FROM jsonb_array_elements(w.blocks) as block)
        ELSE jsonb_array_length(COALESCE(w.exercises, '[]'::jsonb))
    END as total_exercise_count
FROM workouts w;

-- Add comments for documentation
COMMENT ON COLUMN workouts.blocks IS 'JSONB array containing workout blocks with exercises, flow settings, and metadata';
COMMENT ON COLUMN workouts.is_block_based IS 'Flag indicating if this workout uses the new block-based structure';
COMMENT ON COLUMN workouts.block_version IS 'Version number for block schema evolution';

COMMIT; 