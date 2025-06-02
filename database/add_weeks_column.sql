-- Add weeks column to monthly_plans table
-- This fixes the error: Could not find the 'weeks' column of 'monthly_plans' in the schema cache

ALTER TABLE public.monthly_plans ADD COLUMN weeks jsonb NOT NULL DEFAULT '[]'::jsonb; 