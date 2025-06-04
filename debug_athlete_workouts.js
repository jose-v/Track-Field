import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdfqhhfirorgdjldmyzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZnFoaGZpcm9yZ2RqbGRteXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzI4NzQsImV4cCI6MjA1MDA0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAthleteWorkouts() {
  console.log('🔍 Debugging athlete workouts for today...\n');

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`📅 Today's date: ${todayStr}`);
    console.log(`📅 Today's date object: ${today}`);
    console.log('');

    // Get all athletes
    const { data: athletes, error: athletesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('role', 'athlete');

    if (athletesError) {
      console.error('❌ Error fetching athletes:', athletesError);
      return;
    }

    console.log(`👥 Found ${athletes?.length || 0} athletes`);
    
    for (const athlete of athletes || []) {
      console.log(`\n🔍 Checking ${athlete.first_name} ${athlete.last_name} (${athlete.id})`);
      
      // 1. Check regular workouts for today
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, name, date, user_id, exercises')
        .eq('date', todayStr);

      if (workoutsError) {
        console.error('❌ Error fetching workouts:', workoutsError);
      } else {
        const athleteWorkouts = workouts?.filter(w => w.user_id === athlete.id) || [];
        console.log(`   💪 Regular workouts for today: ${athleteWorkouts.length}`);
        athleteWorkouts.forEach(workout => {
          console.log(`      - ${workout.name} (${workout.exercises?.length || 0} exercises)`);
        });
      }

      // 2. Check training plan assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('training_plan_assignments')
        .select(`
          *,
          training_plans (
            id,
            name,
            start_date,
            end_date,
            weekly_workout_ids
          )
        `)
        .eq('athlete_id', athlete.id);

      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
      } else {
        console.log(`   📋 Training plan assignments: ${assignments?.length || 0}`);
        
        for (const assignment of assignments || []) {
          console.log(`      - Plan: ${assignment.training_plans?.name || 'Unknown'}`);
          console.log(`        Status: ${assignment.status}`);
          console.log(`        Start: ${assignment.training_plans?.start_date}`);
          console.log(`        End: ${assignment.training_plans?.end_date}`);
          console.log(`        Weekly workouts: ${assignment.training_plans?.weekly_workout_ids?.length || 0}`);
          
          // Check if today falls within the plan's date range
          if (assignment.training_plans?.start_date && assignment.training_plans?.end_date) {
            const startDate = new Date(assignment.training_plans.start_date);
            const endDate = new Date(assignment.training_plans.end_date);
            
            const isInRange = today >= startDate && today <= endDate;
            console.log(`        Is today in range? ${isInRange}`);
            
            if (isInRange) {
              // Calculate which week we're in
              const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const currentWeek = Math.floor(daysSinceStart / 7) + 1;
              console.log(`        Days since start: ${daysSinceStart}`);
              console.log(`        Current week: ${currentWeek}`);
              
              // Check if there's a workout for this week
              const weeklyWorkouts = assignment.training_plans.weekly_workout_ids || [];
              const currentWorkoutId = weeklyWorkouts[currentWeek - 1];
              console.log(`        Workout ID for week ${currentWeek}: ${currentWorkoutId || 'None'}`);
              
              if (currentWorkoutId) {
                // Get the actual workout
                const { data: workout, error: workoutError } = await supabase
                  .from('workouts')
                  .select('id, name, exercises')
                  .eq('id', currentWorkoutId)
                  .single();
                
                if (!workoutError && workout) {
                  console.log(`        ✅ Today's workout: ${workout.name} (${workout.exercises?.length || 0} exercises)`);
                } else {
                  console.log(`        ❌ Workout not found: ${workoutError?.message || 'Unknown error'}`);
                }
              }
            }
          }
          console.log('');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

debugAthleteWorkouts(); 