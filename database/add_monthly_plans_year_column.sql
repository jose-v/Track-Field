-- Add year column to monthly_plans table
-- This fixes the error: column monthly_plans.year does not exist

-- Check if monthly_plans table exists, if not create it
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  weeks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add year column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'monthly_plans' 
    AND column_name = 'year'
  ) THEN
    ALTER TABLE public.monthly_plans 
    ADD COLUMN year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());
    
    -- Add constraint to ensure year is reasonable
    ALTER TABLE public.monthly_plans 
    ADD CONSTRAINT check_year_valid CHECK (year >= 2020 AND year <= 2050);
  END IF;
END $$;

-- Create monthly_plan_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.monthly_plan_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_plan_id uuid REFERENCES public.monthly_plans(id) ON DELETE CASCADE NOT NULL,
  athlete_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(monthly_plan_id, athlete_id)
);

-- Enable RLS
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plan_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_plans
DROP POLICY IF EXISTS "Coaches can view their own monthly plans" ON public.monthly_plans;
CREATE POLICY "Coaches can view their own monthly plans" ON public.monthly_plans
  FOR SELECT USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can create monthly plans" ON public.monthly_plans
  FOR INSERT WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can update their own monthly plans" ON public.monthly_plans
  FOR UPDATE USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete their own monthly plans" ON public.monthly_plans
  FOR DELETE USING (coach_id = auth.uid());

-- RLS Policies for monthly_plan_assignments
DROP POLICY IF EXISTS "Users can view assignments where they are coach or athlete" ON public.monthly_plan_assignments;
CREATE POLICY "Users can view assignments where they are coach or athlete" ON public.monthly_plan_assignments
  FOR SELECT USING (
    assigned_by = auth.uid() OR 
    athlete_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.monthly_plans mp 
      WHERE mp.id = monthly_plan_id AND mp.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can create assignments" ON public.monthly_plan_assignments;
CREATE POLICY "Coaches can create assignments" ON public.monthly_plan_assignments
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.monthly_plans mp 
      WHERE mp.id = monthly_plan_id AND mp.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can update assignments for their plans" ON public.monthly_plan_assignments;
CREATE POLICY "Coaches can update assignments for their plans" ON public.monthly_plan_assignments
  FOR UPDATE USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.monthly_plans mp 
      WHERE mp.id = monthly_plan_id AND mp.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can delete assignments for their plans" ON public.monthly_plan_assignments;
CREATE POLICY "Coaches can delete assignments for their plans" ON public.monthly_plan_assignments
  FOR DELETE USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.monthly_plans mp 
      WHERE mp.id = monthly_plan_id AND mp.coach_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_plans_coach_id ON public.monthly_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_year_month ON public.monthly_plans(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_assignments_plan_id ON public.monthly_plan_assignments(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_assignments_athlete_id ON public.monthly_plan_assignments(athlete_id); 