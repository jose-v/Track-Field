-- Function to execute SQL statements securely via RPC
-- This should be executed by a database administrator or superuser
-- Note: This is a potentially dangerous function that should only be used during development
-- and with proper access controls in place

-- Check if the function already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
    WHERE proname = 'execute_sql' AND nspname = 'public'
  ) THEN
    -- Create the function if it doesn't exist
    CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Log the SQL being executed for audit purposes
      INSERT INTO public.sql_execution_log(executed_by, sql_text, execution_time)
      VALUES (auth.uid(), sql, now());
      
      -- Execute the SQL statement
      EXECUTE sql;
      
      RETURN 'SQL executed successfully';
    EXCEPTION WHEN OTHERS THEN
      -- Log the error
      INSERT INTO public.sql_execution_log(executed_by, sql_text, execution_time, error_message)
      VALUES (auth.uid(), sql, now(), SQLERRM);
      
      RAISE;
    END;
    $$;
    
    -- Set proper permissions
    REVOKE ALL ON FUNCTION public.execute_sql(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
    
    -- Create the logging table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.sql_execution_log (
      id SERIAL PRIMARY KEY,
      executed_by UUID REFERENCES auth.users(id),
      sql_text TEXT NOT NULL,
      execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
      error_message TEXT
    );
    
    -- Set RLS policies on the log table
    ALTER TABLE public.sql_execution_log ENABLE ROW LEVEL SECURITY;
    
    -- Only admins can view execution logs
    CREATE POLICY "Admins can see all SQL execution logs"
      ON public.sql_execution_log
      FOR SELECT
      TO authenticated
      USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
      ));
      
    -- Users can see their own execution logs
    CREATE POLICY "Users can see their own SQL execution logs"
      ON public.sql_execution_log
      FOR SELECT
      TO authenticated
      USING (auth.uid() = executed_by);
      
    RAISE NOTICE 'execute_sql function and supporting tables created successfully';
  ELSE
    RAISE NOTICE 'execute_sql function already exists';
  END IF;
END
$$; 