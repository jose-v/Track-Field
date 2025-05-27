#!/usr/bin/env node
/**
 * This script applies the tracking_tables.sql migration to create sleep_records and eating_records tables.
 * 
 * Usage:
 * node run-tracking-tables.js
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY) must be set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to migration file
const migrationFile = path.resolve(__dirname, './tracking_tables.sql');

async function runMigration() {
  try {
    // Read the migration file
    console.log(`Reading migration file from ${migrationFile}`);
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    console.log('You need to run this SQL migration on your Supabase project using the SQL Editor.');
    console.log('Please follow these steps:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy the following SQL and paste it into the SQL editor:');
    console.log('\n----- SQL MIGRATION START -----\n');
    console.log(migrationSql);
    console.log('\n----- SQL MIGRATION END -----\n');
    console.log('5. Click "Run" to execute the SQL commands');
    console.log('\nAlternatively, you can use the Supabase CLI to run this migration.');
    
    console.log('\nNote: The remote execution of SQL statements is not available through the REST API.');
    console.log('The functions must be created manually using the SQL Editor or Supabase CLI.');
    
  } catch (error) {
    console.error('Error reading migration file:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 