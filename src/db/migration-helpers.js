const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Migration Helper for Track & Field Application
 * 
 * This script helps set up the database by running migration files.
 * 
 * Usage: 
 * node migration-helpers.js [--test] [--seed] [--views]
 * 
 * Options:
 * --test: Run in test mode (doesn't execute SQL, just logs it)
 * --seed: Also run the seed data script (for development only)
 * --views: Also create database views
 */

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are defined in your .env file');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const testMode = args.includes('--test');
const runSeed = args.includes('--seed');
const createViews = args.includes('--views');

// Create Supabase client with service key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Run a SQL file against the Supabase database
 */
async function runSqlFile(filePath, description) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running ${description}...`);
    
    if (testMode) {
      console.log('TEST MODE: Would run the following SQL:');
      console.log(sql.substring(0, 500) + '...');
      return true;
    }
    
    const { error } = await supabase.rpc('pg_execute', { query: sql });
    
    if (error) {
      console.error(`Error running ${description}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully ran ${description}`);
    return true;
  } catch (err) {
    console.error(`Error reading or executing ${description}:`, err);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting database migrations...');
  
  // 1. Run main migrations
  const migrationsFile = path.resolve(__dirname, 'migrations.sql');
  const migrationsSuccess = await runSqlFile(migrationsFile, 'schema migrations');
  
  if (!migrationsSuccess) {
    console.error('❌ Failed to run schema migrations, aborting');
    process.exit(1);
  }
  
  // 2. Create views if requested
  if (createViews) {
    const viewsFile = path.resolve(__dirname, 'views.sql');
    const viewsSuccess = await runSqlFile(viewsFile, 'database views');
    
    if (!viewsSuccess) {
      console.warn('⚠️ Failed to create database views, but continuing');
    }
  }
  
  // 3. Run seed data if requested
  if (runSeed) {
    console.warn('\n⚠️ ADDING SEED DATA - ONLY FOR DEVELOPMENT! ⚠️');
    console.warn('This will add fictional data to your database\n');
    
    if (!testMode) {
      // Add a delay to give the user a chance to cancel
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const seedFile = path.resolve(__dirname, 'seed-data.sql');
    const seedSuccess = await runSqlFile(seedFile, 'seed data');
    
    if (!seedSuccess) {
      console.warn('⚠️ Failed to add seed data');
    }
  }
  
  console.log('\n✅ Database setup complete!');
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
}); 