// Test script to verify soft delete functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSoftDelete() {
  console.log('🧪 Testing Soft Delete Functionality...\n');

  try {
    // Test 1: Check if deleted_at and deleted_by columns exist in workouts table
    console.log('1. Checking workouts table schema...');
    const { data: workoutsSchema, error: workoutsError } = await supabase
      .from('workouts')
      .select('deleted_at, deleted_by')
      .limit(1);
    
    if (workoutsError) {
      console.error('❌ Workouts table schema check failed:', workoutsError.message);
    } else {
      console.log('✅ Workouts table has soft delete columns');
    }

    // Test 2: Check if deleted_at and deleted_by columns exist in monthly_plans table
    console.log('2. Checking monthly_plans table schema...');
    const { data: plansSchema, error: plansError } = await supabase
      .from('monthly_plans')
      .select('deleted_at, deleted_by')
      .limit(1);
    
    if (plansError) {
      console.error('❌ Monthly plans table schema check failed:', plansError.message);
    } else {
      console.log('✅ Monthly plans table has soft delete columns');
    }

    // Test 3: Check if we can query non-deleted items
    console.log('3. Testing non-deleted items query...');
    const { data: activeWorkouts, error: activeError } = await supabase
      .from('workouts')
      .select('id, name, deleted_at')
      .is('deleted_at', null)
      .limit(5);
    
    if (activeError) {
      console.error('❌ Active workouts query failed:', activeError.message);
    } else {
      console.log(`✅ Found ${activeWorkouts.length} active workouts`);
    }

    // Test 4: Check if we can query deleted items
    console.log('4. Testing deleted items query...');
    const { data: deletedWorkouts, error: deletedError } = await supabase
      .from('workouts')
      .select('id, name, deleted_at')
      .not('deleted_at', 'is', null)
      .limit(5);
    
    if (deletedError) {
      console.error('❌ Deleted workouts query failed:', deletedError.message);
    } else {
      console.log(`✅ Found ${deletedWorkouts.length} deleted workouts`);
    }

    console.log('\n🎉 Soft delete functionality tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSoftDelete(); 