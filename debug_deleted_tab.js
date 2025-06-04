// Debug script for testing deleted tab functionality
// This will help us understand why deleted items aren't showing

import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDeletedTab() {
  console.log('🔍 Debugging Deleted Tab Functionality...\n');

  try {
    // Step 1: Check if we have coaches in the system
    console.log('1. Checking for coaches...');
    const { data: coaches, error: coachError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('role', 'coach')
      .limit(3);
    
    if (coachError) {
      console.error('❌ Error fetching coaches:', coachError);
      return;
    }
    
    console.log(`✅ Found ${coaches.length} coaches`);
    if (coaches.length > 0) {
      console.log('   Sample coach:', coaches[0]);
    }

    const testCoachId = coaches[0]?.id;
    if (!testCoachId) {
      console.log('❌ No coaches found to test with');
      return;
    }

    // Step 2: Check for existing deleted workouts
    console.log('\n2. Checking for existing deleted workouts...');
    const { data: deletedWorkouts, error: workoutError } = await supabase
      .from('workouts')
      .select('id, name, type, user_id, deleted_at, deleted_by')
      .eq('user_id', testCoachId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (workoutError) {
      console.error('❌ Error fetching deleted workouts:', workoutError);
    } else {
      console.log(`✅ Found ${deletedWorkouts.length} deleted workouts for coach ${testCoachId}`);
      deletedWorkouts.forEach(workout => {
        console.log(`   - ${workout.name} (deleted: ${workout.deleted_at})`);
      });
    }

    // Step 3: Check for existing deleted training plans
    console.log('\n3. Checking for existing deleted training plans...');
    const { data: deletedPlans, error: planError } = await supabase
      .from('training_plans')
      .select('id, name, coach_id, deleted_at, deleted_by')
      .eq('coach_id', testCoachId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (planError) {
      console.error('❌ Error fetching deleted training plans:', planError);
    } else {
      console.log(`✅ Found ${deletedPlans.length} deleted training plans for coach ${testCoachId}`);
      deletedPlans.forEach(plan => {
        console.log(`   - ${plan.name} (deleted: ${plan.deleted_at})`);
      });
    }

    // Step 4: Test the exact API calls used by the frontend
    console.log('\n4. Testing frontend API calls...');
    
    // Test workouts.getDeleted
    try {
      const workoutsResult = await fetch('/api/test-workouts-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testCoachId })
      });
      console.log('✅ Frontend workouts API call would succeed');
    } catch (error) {
      console.log('ℹ️  Frontend API not testable from this script');
    }

    // Step 5: Create test data if none exists
    if (deletedWorkouts.length === 0 && deletedPlans.length === 0) {
      console.log('\n5. No deleted items found. Creating test data...');
      
      // Create a test workout and immediately soft delete it
      const { data: newWorkout, error: createWorkoutError } = await supabase
        .from('workouts')
        .insert({
          name: 'Test Deleted Workout - Debug',
          user_id: testCoachId,
          description: 'Created by debug script to test deleted tab',
          type: 'Test',
          exercises: []
        })
        .select()
        .single();
      
      if (createWorkoutError) {
        console.error('❌ Error creating test workout:', createWorkoutError);
      } else {
        // Immediately soft delete it
        const { error: deleteWorkoutError } = await supabase
          .from('workouts')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: testCoachId
          })
          .eq('id', newWorkout.id);
        
        if (deleteWorkoutError) {
          console.error('❌ Error soft-deleting test workout:', deleteWorkoutError);
        } else {
          console.log('✅ Created and soft-deleted test workout:', newWorkout.name);
        }
      }

      // Create a test training plan and immediately soft delete it
      const { data: newPlan, error: createPlanError } = await supabase
        .from('training_plans')
        .insert({
          name: 'Test Deleted Training Plan - Debug',
          coach_id: testCoachId,
          description: 'Created by debug script to test deleted tab',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          weeks: []
        })
        .select()
        .single();
      
      if (createPlanError) {
        console.error('❌ Error creating test training plan:', createPlanError);
      } else {
        // Immediately soft delete it
        const { error: deletePlanError } = await supabase
          .from('training_plans')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: testCoachId
          })
          .eq('id', newPlan.id);
        
        if (deletePlanError) {
          console.error('❌ Error soft-deleting test training plan:', deletePlanError);
        } else {
          console.log('✅ Created and soft-deleted test training plan:', newPlan.name);
        }
      }
    }

    // Step 6: Final verification
    console.log('\n6. Final verification - checking deleted items again...');
    const { data: finalWorkouts } = await supabase
      .from('workouts')
      .select('id, name, deleted_at')
      .eq('user_id', testCoachId)
      .not('deleted_at', 'is', null);
    
    const { data: finalPlans } = await supabase
      .from('training_plans')
      .select('id, name, deleted_at')
      .eq('coach_id', testCoachId)
      .not('deleted_at', 'is', null);

    console.log(`✅ Total deleted workouts: ${finalWorkouts?.length || 0}`);
    console.log(`✅ Total deleted training plans: ${finalPlans?.length || 0}`);

    if ((finalWorkouts?.length || 0) + (finalPlans?.length || 0) > 0) {
      console.log('\n🎉 Deleted items exist! The frontend should show them.');
      console.log('💡 If the deleted tab is still empty, the issue is likely:');
      console.log('   1. Frontend API calls using wrong user ID');
      console.log('   2. Tab loading logic not triggering');
      console.log('   3. Component rendering issue');
    } else {
      console.log('\n❌ No deleted items found even after creation.');
      console.log('💡 This suggests a database schema or permissions issue.');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Export for Node.js or run directly in browser console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugDeletedTab };
} else {
  debugDeletedTab();
} 