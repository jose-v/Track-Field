-- Migration: Add workout flow type and circuit rounds columns
-- Run this in Supabase SQL Editor

BEGIN;

-- Add flow_type column with default 'sequential'
ALTER TABLE workouts 
ADD COLUMN flow_type TEXT CHECK (flow_type IN ('sequential', 'circuit')) DEFAULT 'sequential';

-- Add circuit_rounds column with default 3
ALTER TABLE workouts 
ADD COLUMN circuit_rounds INTEGER DEFAULT 3 CHECK (circuit_rounds >= 1 AND circuit_rounds <= 20);

-- Add comments for documentation
COMMENT ON COLUMN workouts.flow_type IS 'Workout execution flow: sequential (complete all sets of one exercise before next) or circuit (rotate through exercises for multiple rounds)';
COMMENT ON COLUMN workouts.circuit_rounds IS 'Number of rounds for circuit workouts (1-20), ignored for sequential workouts';

-- Update existing workouts to have explicit flow_type = 'sequential' (optional, since we have a default)
UPDATE workouts 
SET flow_type = 'sequential' 
WHERE flow_type IS NULL;

-- Update existing workouts to have circuit_rounds = 3 (optional, since we have a default)
UPDATE workouts 
SET circuit_rounds = 3 
WHERE circuit_rounds IS NULL;

COMMIT; 