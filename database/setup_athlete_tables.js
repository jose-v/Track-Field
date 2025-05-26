import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vdfqhhfirorqdjldmyzc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not defined in your environment variables.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to read and execute SQL files
async function executeSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file by semicolons to execute statements separately
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements in ${filePath}`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      try {
        // Execute the SQL statement using Supabase's rpc call
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Successfully executed statement ${i + 1}`);
        }
      } catch (stmtError) {
        console.error(`Exception executing statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log(`Completed execution of ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Main function to execute SQL files
async function setupAthleteTables() {
  console.log('Setting up athlete data tables...');
  
  const sqlDirectory = path.join(process.cwd(), 'src', 'db');
  const sqlFiles = [
    'create_athlete_sleep_table.sql',
    'create_athlete_meets_table.sql',
    'create_athlete_performances_table.sql'
  ];
  
  for (const file of sqlFiles) {
    const filePath = path.join(sqlDirectory, file);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${file}...`);
      await executeSqlFile(filePath);
    } else {
      console.error(`SQL file not found: ${filePath}`);
    }
  }
  
  console.log('Athlete tables setup complete!');
}

// Run the setup
setupAthleteTables()
  .then(() => console.log('All done!'))
  .catch(err => console.error('Error in setup process:', err))
  .finally(() => process.exit()); 