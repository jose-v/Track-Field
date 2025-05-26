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

// List of tables to examine
const tablesToExamine = [
  'profiles',
  'athletes',
  'coaches',
  'coach_athletes',
  'sleep_records',
  'notifications',
  'workouts',
  'events'
];

async function examineTable(tableName) {
  console.log(`\n--- EXAMINING TABLE: ${tableName} ---`);
  
  try {
    // First check if table exists by querying one row
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`ERROR: Table ${tableName} does not exist or cannot be accessed:`, error.message);
      return;
    }
    
    console.log(`Table ${tableName} exists`);
    
    if (data && data.length > 0) {
      console.log('COLUMNS:');
      const sample = data[0];
      for (const column in sample) {
        const valueType = typeof sample[column];
        const value = sample[column] ? 
          (valueType === 'object' ? 'Complex object' : 
           String(sample[column]).substring(0, 50) + 
           (String(sample[column]).length > 50 ? '...' : '')) : 
          'null';
        console.log(`  - ${column}: ${valueType} (Sample: ${value})`);
      }
      
      // Get a few more rows to analyze if available
      const { data: moreData, error: moreError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (!moreError && moreData && moreData.length > 1) {
        console.log(`\nSAMPLE DATA (${moreData.length} rows):`);
        moreData.forEach((row, i) => {
          console.log(`Row ${i+1}:`, JSON.stringify(row, null, 2).substring(0, 300) + 
            (JSON.stringify(row, null, 2).length > 300 ? '...' : ''));
        });
      }
    } else {
      console.log('No data found in this table');
    }
    
    // Check for foreign key relationships
    console.log('\nAnalyzing possible relationships:');
    for (const column in data[0] || {}) {
      if (column.endsWith('_id')) {
        const possibleTable = column.replace('_id', '');
        console.log(`  - ${column} might be a foreign key to the "${possibleTable}" or "${possibleTable}s" table`);
      }
    }
  } catch (err) {
    console.error(`Error examining table ${tableName}:`, err);
  }
}

// Special examination for key tables that we need
async function examineKeyColumn(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(3);
    
    if (!error && data) {
      console.log(`\nVALUES for ${tableName}.${columnName}:`);
      data.forEach((row, i) => {
        console.log(`  ${i+1}. ${row[columnName] || 'null'}`);
      });
    }
  } catch (err) {
    console.error(`Error examining ${tableName}.${columnName}:`, err);
  }
}

async function main() {
  console.log('DATABASE SCHEMA ANALYSIS');
  console.log('========================\n');
  
  // Examine each table
  for (const table of tablesToExamine) {
    await examineTable(table);
  }
  
  // Specific key columns that need special attention
  console.log('\n\n--- EXAMINING KEY RELATIONSHIPS ---');
  await examineKeyColumn('athletes', 'id');
  await examineKeyColumn('sleep_records', 'athlete_id');
  await examineKeyColumn('workouts', 'athlete_id');
  await examineKeyColumn('events', 'id');
  
  console.log('\nAnalysis complete!');
}

main().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
}); 