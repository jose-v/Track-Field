// Debug script to check exercise data in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExerciseData() {
  console.log('Checking exercise data in database...');
  
  // Get all exercise results
  const { data: exerciseResults, error } = await supabase
    .from('exercise_results_for_analytics')
    .select('*')
    .order('completed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching exercise results:', error);
    return;
  }
  
  console.log('Total exercise results:', exerciseResults.length);
  
  // Filter for running exercises
  const runningExercises = exerciseResults.filter(exercise => {
    const exerciseName = exercise.exercise_name?.toLowerCase() || '';
    return exerciseName.includes('run') ||
           exerciseName.includes('sprint') ||
           exerciseName.includes('dash') ||
           exerciseName.includes('meter') ||
           exerciseName.includes('mile') ||
           exerciseName.includes('jog');
  });
  
  console.log('Running exercises found:', runningExercises.length);
  
  // Check for future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const futureExercises = runningExercises.filter(exercise => {
    const exerciseDate = new Date(exercise.completed_at);
    return exerciseDate > today;
  });
  
  console.log('Future dated exercises:', futureExercises.length);
  
  if (futureExercises.length > 0) {
    console.log('Future exercises found:');
    futureExercises.forEach(exercise => {
      console.log({
        id: exercise.id,
        exercise_name: exercise.exercise_name,
        completed_at: exercise.completed_at,
        date: new Date(exercise.completed_at).toLocaleDateString(),
        time_minutes: exercise.time_minutes,
        time_seconds: exercise.time_seconds,
        time_hundredths: exercise.time_hundredths
      });
    });
  }
  
  // Check for 100m sprint specifically
  const sprint100m = runningExercises.filter(exercise => 
    exercise.exercise_name.toLowerCase().includes('100m')
  );
  
  console.log('100m sprint exercises found:', sprint100m.length);
  
  if (sprint100m.length > 0) {
    console.log('100m sprint exercises:');
    sprint100m.forEach(exercise => {
      console.log({
        id: exercise.id,
        exercise_name: exercise.exercise_name,
        completed_at: exercise.completed_at,
        date: new Date(exercise.completed_at).toLocaleDateString(),
        time_minutes: exercise.time_minutes,
        time_seconds: exercise.time_seconds,
        time_hundredths: exercise.time_hundredths
      });
    });
  }
}

debugExerciseData().catch(console.error); 