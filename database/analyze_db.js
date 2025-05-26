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

async function analyzeDatabase() {
  try {
    console.log('Analyzing database structure...\n');
    
    // Get list of all tables
    console.log('FETCHING ALL TABLES:');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations')
      .order('table_name');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      
      // Try alternate approach
      console.log('\nTrying alternate approach to get tables...');
      const { data: tables, error } = await supabase.rpc('get_tables');
      
      if (error) {
        console.error('Error with alternate approach:', error);
        
        // List tables we know exist by trying to query them
        console.log('\nTrying to verify some common tables:');
        const knownTables = [
          'profiles', 'athletes', 'coaches', 'coach_athletes', 
          'sleep_records', 'notifications', 'workouts', 'events',
          'athlete_performances', 'athlete_meets', 'athlete_sleep'
        ];
        
        for (const tableName of knownTables) {
          try {
            const { error } = await supabase.from(tableName).select('count').limit(1);
            console.log(`Table ${tableName}: ${error ? 'Does not exist' : 'Exists'}`);
          } catch (e) {
            console.log(`Table ${tableName}: Error checking`);
          }
        }
      } else {
        console.log('Tables found:', tables);
      }
    } else {
      console.log(`Found ${tablesData.length} tables in the database.`);
      
      for (const table of tablesData) {
        const tableName = table.table_name;
        console.log(`\n--- TABLE: ${tableName} ---`);
        
        // Get first record to see structure
        const { data: rowData, error: rowError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (rowError) {
          console.log(`Error fetching data from ${tableName}:`, rowError.message);
          continue;
        }
        
        if (rowData && rowData.length > 0) {
          console.log(`COLUMNS in ${tableName}:`);
          const columns = Object.keys(rowData[0]);
          columns.forEach(col => {
            const value = rowData[0][col];
            const type = value === null ? 'NULL' : typeof value;
            console.log(`  ${col}: ${type}`);
          });
          
          // Get total count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`  Total Records: ${count}`);
          }
        } else {
          console.log(`No data in ${tableName}`);
        }
      }
    }
    
    // Check for sleep-related tables specifically
    console.log('\n\nCHECKING SLEEP DATA TABLES:');
    
    // Check sleep_records
    const { data: sleepRecords, error: sleepError } = await supabase
      .from('sleep_records')
      .select('*')
      .limit(1);
    
    if (!sleepError) {
      console.log('sleep_records table exists with schema:');
      console.log(JSON.stringify(sleepRecords[0], null, 2));
    } else {
      console.log('sleep_records error:', sleepError.message);
    }
    
    // Check athlete_sleep
    const { data: athleteSleep, error: athleteSleepError } = await supabase
      .from('athlete_sleep')
      .select('*')
      .limit(1);
    
    if (!athleteSleepError) {
      console.log('athlete_sleep table exists with schema:');
      console.log(JSON.stringify(athleteSleep[0], null, 2));
    } else {
      console.log('athlete_sleep error:', athleteSleepError.message);
    }
    
    console.log('\nDatabase analysis complete.');
    
  } catch (error) {
    console.error('Error analyzing database:', error);
  }
}

analyzeDatabase()
  .then(() => console.log('Analysis complete.'))
  .catch(err => console.error('Error:', err))
  .finally(() => process.exit()); 