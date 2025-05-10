import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module file path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to read and execute SQL file
async function runSqlFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    console.log(`Reading SQL file: ${filePath}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running SQL from ${filename} (${sql.length} characters)`);
    
    // Using Supabase's pg_execute RPC function which requires service role
    const { error } = await supabase.rpc('pg_execute', { query: sql });
    
    if (error) {
      console.error(`Error executing ${filename}:`, error);
      return false;
    }
    
    console.log(`Successfully executed ${filename}`);
    return true;
  } catch (err) {
    console.error(`Failed to run ${filename}:`, err);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting database setup...');
  
  // Step 1: Run migrations
  console.log('\n--- RUNNING MIGRATIONS ---');
  const migrationsSuccess = await runSqlFile('migrations.sql');
  if (!migrationsSuccess) {
    console.error('Failed to run migrations. Exiting.');
    process.exit(1);
  }
  
  // Step 2: Create views
  console.log('\n--- CREATING VIEWS ---');
  const viewsSuccess = await runSqlFile('views.sql');
  if (!viewsSuccess) {
    console.warn('Failed to create views, but continuing...');
  }
  
  // Step 3: Add seed data if requested
  if (process.argv.includes('--seed')) {
    console.log('\n--- ADDING SEED DATA ---');
    console.log('WARNING: This will add demo data to your database.');
    
    // Add a 3-second delay to give user time to cancel if needed
    await new Promise(resolve => {
      console.log('Starting in 3 seconds... Press Ctrl+C to cancel.');
      setTimeout(resolve, 3000);
    });
    
    const seedSuccess = await runSqlFile('seed-data.sql');
    if (!seedSuccess) {
      console.warn('Failed to add seed data.');
    }
  }
  
  console.log('\nDatabase setup completed!');
}

main()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 