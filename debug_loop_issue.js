const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLoopIssues() {
  try {
    console.log('=== DEBUGGING LOOP TABLES ===\n');
    
    // 1. Check if tables exist
    console.log('1. Checking table existence:');
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'loop_%'
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Loop tables found:', tables);
    }
    
    // 2. Check loop_likes structure
    console.log('\n2. Checking loop_likes table structure:');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'loop_likes' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (columnsError) {
      console.error('Error checking columns:', columnsError);
    } else {
      console.log('loop_likes columns:', columns);
    }
    
    // 3. Check foreign key constraints
    console.log('\n3. Checking foreign key constraints:');
    const { data: fks, error: fksError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'loop_likes'
            AND tc.constraint_type = 'FOREIGN KEY';
      `
    });
    
    if (fksError) {
      console.error('Error checking foreign keys:', fksError);
    } else {
      console.log('Foreign keys:', fks);
    }
    
    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies:');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schemaname, tablename, policyname, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'loop_likes'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('RLS policies:', policies);
    }
    
    // 5. Check RLS status
    console.log('\n5. Checking RLS status:');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schemaname, tablename, rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE tablename = 'loop_likes';
      `
    });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS status:', rlsStatus);
    }
    
    // 6. Try to query loop_likes directly
    console.log('\n6. Testing direct query:');
    const { data: directQuery, error: directError } = await supabase.rpc('exec_sql', {
      query: `SELECT COUNT(*) as total_likes FROM loop_likes;`
    });
    
    if (directError) {
      console.error('Error with direct query:', directError);
    } else {
      console.log('Direct query result:', directQuery);
    }
    
    // 7. Test the specific query that's failing
    console.log('\n7. Testing problematic query:');
    const { data: testData, error: testError } = await supabase
      .from('loop_likes')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error with Supabase client query:', testError);
    } else {
      console.log('Supabase client query successful:', testData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugLoopIssues(); 