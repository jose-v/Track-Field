// check-track-meets-tables.js
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found, using environment variables directly');
  dotenv.config();
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const tables = [
    'track_meets',
    'meet_events',
    'athlete_meet_events'
  ];
  
  console.log('Checking for track meets tables...');
  
  for (const tableName of tables) {
    try {
      // Query to check if table exists
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (error) {
        console.error(`Error checking table ${tableName}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`✓ Table '${tableName}' exists`);
        
        // Check for some records
        const { data: records, error: recordsError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (recordsError) {
          console.log(`  Error checking records: ${recordsError.message}`);
        } else {
          console.log(`  Found ${records?.length || 0} records`);
        }
      } else {
        console.log(`✗ Table '${tableName}' does not exist`);
      }
    } catch (err) {
      console.error(`Error checking table ${tableName}:`, err);
    }
  }
}

checkTables().catch(err => {
  console.error('Error checking tables:', err);
  process.exit(1);
}); 