import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - we'll read them from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running monthly plans migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_monthly_plans_year_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing SQL migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_text: sql 
    });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Verifying table structure...');
    
    // Verify the table exists and has the year column
    const { data: tableInfo, error: verifyError } = await supabase
      .from('monthly_plans')
      .select('*')
      .limit(0);
    
    if (verifyError) {
      console.error('❌ Error verifying table:', verifyError);
    } else {
      console.log('✅ Monthly plans table verified successfully!');
    }
    
    // Check if we can query with year column
    const { data: testQuery, error: testError } = await supabase
      .from('monthly_plans')
      .select('id, name, year, month')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing year column:', testError);
    } else {
      console.log('✅ Year column is working correctly!');
    }
    
    console.log('🎉 Migration completed successfully! The monthly plans feature should now work.');
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
    process.exit(1);
  }
}

runMigration(); 