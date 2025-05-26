// Create tables for athlete data using direct Supabase API calls
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

async function createAthleteTables() {
  try {
    console.log('Creating athlete_sleep table...');
    
    // Create athlete_sleep table
    const { error: sleepError } = await supabase
      .from('athlete_sleep')
      .insert({
        athlete_id: '00000000-0000-0000-0000-000000000000', // Placeholder 
        weekly_total: 49.5,
        weekly_average: 7.1,
        quality: 'Good',
        comparison_note: 'Sample placeholder data'
      })
      .select();
    
    if (sleepError) {
      if (sleepError.code === '42P01') {
        console.log('athlete_sleep table does not exist yet. Tables need to be created manually in Supabase.');
      } else {
        console.error('Error with athlete_sleep:', sleepError);
      }
    } else {
      console.log('athlete_sleep table exists and is accessible.');
    }
    
    console.log('Creating athlete_meets table...');
    
    // Create athlete_meets table
    const { error: meetsError } = await supabase
      .from('athlete_meets')
      .insert({
        athlete_id: '00000000-0000-0000-0000-000000000000', // Placeholder 
        name: 'Carter Invitational',
        date: '2025-12-11',
        location: 'Greensboro, NC',
        start_time: '10:00 AM',
        notes: 'Sample placeholder data'
      })
      .select();
    
    if (meetsError) {
      if (meetsError.code === '42P01') {
        console.log('athlete_meets table does not exist yet. Tables need to be created manually in Supabase.');
      } else {
        console.error('Error with athlete_meets:', meetsError);
      }
    } else {
      console.log('athlete_meets table exists and is accessible.');
    }
    
    console.log('Creating athlete_performances table...');
    
    // Create athlete_performances table
    const { error: perfError } = await supabase
      .from('athlete_performances')
      .insert({
        athlete_id: '00000000-0000-0000-0000-000000000000', // Placeholder 
        event: '100m',
        best_time: '11.3s',
        improvement: '0.2s',
        notes: 'Sample placeholder data'
      })
      .select();
    
    if (perfError) {
      if (perfError.code === '42P01') {
        console.log('athlete_performances table does not exist yet. Tables need to be created manually in Supabase.');
      } else {
        console.error('Error with athlete_performances:', perfError);
      }
    } else {
      console.log('athlete_performances table exists and is accessible.');
    }
    
    console.log('\nIMPORTANT: You need to create these tables manually in Supabase SQL Editor.');
    console.log('The SQL scripts are located in:');
    console.log('1. web/src/db/create_athlete_sleep_table.sql');
    console.log('2. web/src/db/create_athlete_meets_table.sql');
    console.log('3. web/src/db/create_athlete_performances_table.sql');
    console.log('\nPlease run these SQL scripts in the Supabase dashboard SQL Editor.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAthleteTables()
  .then(() => console.log('Athlete tables check complete.'))
  .catch(err => console.error('Error in process:', err))
  .finally(() => process.exit()); 