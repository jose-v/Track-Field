const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vdfqhhfirorgdjldmyzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnFoaGZpcm9yZ2RqbGRteXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzI4NzQsImV4cCI6MjA1MDA0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking database for training plans and assignments...\n');

  try {
    // Check training plans
    const { data: trainingPlans, error: plansError } = await supabase
      .from('training_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (plansError) {
      console.error('❌ Error fetching training plans:', plansError);
    } else {
      console.log(`📋 Training Plans Found: ${trainingPlans?.length || 0}`);
      if (trainingPlans && trainingPlans.length > 0) {
        trainingPlans.forEach((plan, index) => {
          console.log(`  ${index + 1}. ${plan.name} (${plan.id})`);
          console.log(`     Coach: ${plan.coach_id}`);
          console.log(`     Period: ${plan.start_date} to ${plan.end_date}`);
          console.log(`     Workouts: ${plan.weekly_workout_ids?.length || 0} weekly workouts`);
          console.log('');
        });
      }
    }

    // Check training plan assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('training_plan_assignments')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    } else {
      console.log(`👥 Training Plan Assignments Found: ${assignments?.length || 0}`);
      if (assignments && assignments.length > 0) {
        assignments.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Plan ${assignment.training_plan_id} → Athlete ${assignment.athlete_id}`);
          console.log(`     Status: ${assignment.status}`);
          console.log(`     Assigned: ${assignment.assigned_at}`);
          console.log('');
        });
      }
    }

    // Check profiles to see who are athletes vs coaches
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .order('role');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`👤 User Profiles Found: ${profiles?.length || 0}`);
      const coaches = profiles?.filter(p => p.role === 'coach') || [];
      const athletes = profiles?.filter(p => p.role === 'athlete') || [];
      
      console.log(`   Coaches: ${coaches.length}`);
      coaches.forEach(coach => {
        console.log(`     - ${coach.first_name} ${coach.last_name} (${coach.id})`);
      });
      
      console.log(`   Athletes: ${athletes.length}`);
      athletes.forEach(athlete => {
        console.log(`     - ${athlete.first_name} ${athlete.last_name} (${athlete.id})`);
      });
    }

    // Check regular workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, name, user_id, date, is_template')
      .order('created_at', { ascending: false })
      .limit(10);

    if (workoutsError) {
      console.error('❌ Error fetching workouts:', workoutsError);
    } else {
      console.log(`\n💪 Recent Workouts Found: ${workouts?.length || 0}`);
      if (workouts && workouts.length > 0) {
        workouts.forEach((workout, index) => {
          console.log(`  ${index + 1}. ${workout.name} (${workout.id})`);
          console.log(`     Created by: ${workout.user_id}`);
          console.log(`     Date: ${workout.date || 'No date'}`);
          console.log(`     Template: ${workout.is_template ? 'Yes' : 'No'}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkData(); 