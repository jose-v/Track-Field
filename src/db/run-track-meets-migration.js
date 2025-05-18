import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'track_meets_migration.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running track meets migration...');
    
    // Try to execute SQL in two ways:
    // 1. Using direct PostgreSQL connection if execute_sql RPC exists
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        throw error;
      }
      
      console.log('Migration completed successfully using execute_sql RPC!');
      console.log(data);
      return;
    } catch (rpcError) {
      console.log('Could not use execute_sql RPC, trying direct SQL...');
      console.error(rpcError);
    }
    
    // 2. Using direct REST API for individual statements
    console.log('Executing SQL directly via REST API...');
    
    // Split the SQL into individual statements
    const statements = sql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement using the POST API for SQL queries
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the REST API to execute SQL directly
        // This is a simplified approach - for a real implementation,
        // you might need to authenticate as an admin and use proper headers
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
      } catch (sqlError) {
        console.error(`Error executing statement ${i + 1}:`, sqlError);
        console.error('Statement:', statement);
      }
    }
    
    console.log('Migration execution completed. Check for any errors above.');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

console.log('Starting migration process...');
runMigration(); 