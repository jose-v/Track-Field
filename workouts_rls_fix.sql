-- First check if RLS is enabled on the workouts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'workouts' 
        AND rowsecurity = true
    ) THEN
        -- Enable RLS on the workouts table
        ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- Remove any existing workouts policies to avoid conflicts
DROP POLICY IF EXISTS "Workouts are viewable by authenticated users" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;

-- Allow all authenticated users to view workouts
CREATE POLICY "Workouts are viewable by authenticated users"
  ON public.workouts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to create their own workouts
CREATE POLICY "Users can create their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid()::text = created_by::text OR created_by IS NULL);

-- Allow users to update their own workouts
CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid()::text = created_by::text OR created_by IS NULL);

-- Allow users to delete their own workouts
CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id OR auth.uid()::text = created_by::text OR created_by IS NULL);

-- For testing only: Enable a bypass policy that allows any authenticated user to insert
-- You may want to remove this in production
CREATE POLICY "Any authenticated user can create workouts (testing)"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'); 