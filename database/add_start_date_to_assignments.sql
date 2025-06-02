-- Migration: Add start_date column to monthly_plan_assignments
-- This adds a required start_date field for training plan assignments

-- Add the column (already done via dashboard)
-- ALTER TABLE monthly_plan_assignments ADD COLUMN start_date DATE;

-- Update existing assignments to have a start date
-- For existing assignments, set start_date to the assigned_at date
UPDATE monthly_plan_assignments 
SET start_date = assigned_at::date 
WHERE start_date IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE monthly_plan_assignments 
ALTER COLUMN start_date SET NOT NULL; 