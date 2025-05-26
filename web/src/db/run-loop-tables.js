const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service role key not found');
  console.error('Please create a .env file with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read SQL file
const sqlFilePath = path.join(__dirname, 'create_loop_tables.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .filter(statement => statement.trim() !== '')
  .map(statement => statement.trim() + ';');

// Execute SQL statements sequentially
async function executeStatements() {
  try {
    console.log('Setting up Loop feature tables...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        throw error;
      }
      
      process.stdout.write('.');
    }
    
    console.log('\nLoop tables and permissions successfully set up!');
    console.log(`
To use these tables:
1. You can now access the 'loop_posts', 'loop_comments', 'loop_likes', and 'loop_bookmarks' tables
2. Media files can be uploaded to the 'loop_media' storage bucket
3. The Loop social media feature is ready to use in your application
`);
  } catch (error) {
    console.error('Error setting up Loop tables:', error);
    process.exit(1);
  }
}

// Check if exec_sql RPC function exists
async function checkRpcFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
    
    if (error && error.message.includes('function exec_sql(query) does not exist')) {
      console.error('The exec_sql RPC function does not exist on your Supabase instance.');
      console.error(`
Please create it first by executing the following SQL in the Supabase SQL editor:

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`);
      process.exit(1);
    } else if (error) {
      throw error;
    }
    
    // If we got here, the function exists
    executeStatements();
  } catch (error) {
    console.error('Error checking exec_sql function:', error);
    process.exit(1);
  }
}

// Start the process
checkRpcFunction(); 