// Sandbox page for testing weekly workout data processing
import React, { useState } from 'react';

interface WeeklyWorkoutTestData {
  assignment_type: 'weekly';
  exercise_block: {
    workout_name: string;
    daily_workouts: Record<string, any>;
  };
}

const WeeklyWorkoutTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  // Test data representing different weekly workout formats
  const testData: WeeklyWorkoutTestData = {
    assignment_type: 'weekly',
    exercise_block: {
      workout_name: 'Test Weekly Workout',
      daily_workouts: {
        monday: [
          {
            name: 'Upper Body Block',
            sets: 3, // Block-level sets
            reps: 10, // Block-level reps
            exercises: [
              { name: 'Push-ups', sets: 3, reps: 10 }, // Exercise-level values
              { name: 'Pull-ups', sets: 3, reps: 8 }
            ]
          }
        ],
        tuesday: [
          {
            name: 'Lower Body Block',
            sets: 4, // Block-level fallback
            reps: 12,
            exercises: [
              { name: 'Squats' }, // Should inherit block values (4x12)
              { name: 'Lunges', sets: 3, reps: 10 } // Override with exercise values
            ]
          }
        ],
        wednesday: {
          exercises: [
            { name: 'Cardio', sets: 1, reps: 30 }
          ],
          is_rest_day: false
        },
        thursday: {
          exercises: [],
          is_rest_day: true
        },
        friday: [
          {
            name: 'Dynamic Warm-up',
            sets: 2, // Block-level sets
            reps: 4, // Block-level reps  
            exercises: [
              { name: '100m Sprint' }, // Should inherit 2x4 from block
              { name: '400m Run', sets: 2, reps: 3 } // Exercise-level override
            ]
          }
        ]
      }
    }
  };

  const testExerciseExtraction = () => {
    const { daily_workouts } = testData.exercise_block;
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    let todaysWorkout = daily_workouts[currentDayName];
    
    // If no workout for today, try to find the first available day
    if (!todaysWorkout) {
      const firstAvailableDay = Object.keys(daily_workouts).find(dayKey => {
        const dayWorkout = daily_workouts[dayKey];
        return dayWorkout && (
          Array.isArray(dayWorkout) ? dayWorkout.length > 0 : 
          (dayWorkout.exercises && dayWorkout.exercises.length > 0)
        );
      });
      
      if (firstAvailableDay) {
        todaysWorkout = daily_workouts[firstAvailableDay];
      }
    }
    
    let exerciseList: any[] = [];
    
    if (todaysWorkout) {
      if (Array.isArray(todaysWorkout)) {
        // New blocks format: array of blocks, each with exercises
        exerciseList = todaysWorkout.flatMap((block: any) => {
          const exercises = block.exercises || [];
          // Copy block-level metadata to individual exercises if they don't have it
          return exercises.map((exercise: any) => ({
            ...exercise,
            sets: exercise.sets || block.sets || exercise.Sets || block.Sets || 1,
            reps: exercise.reps || block.reps || exercise.Reps || block.Reps || 1,
            rest: exercise.rest || block.rest || exercise.Rest || block.Rest || 0
          }));
        });
      } else if (todaysWorkout.exercises && !todaysWorkout.is_rest_day) {
        // Old format: { exercises: [], is_rest_day: boolean }
        exerciseList = todaysWorkout.exercises || [];
      }
    }
    
    // If no exercises found, try to fallback to first available day
    if (exerciseList.length === 0) {
      const firstAvailableDay = Object.values(daily_workouts).find((day: any) => {
        if (Array.isArray(day)) {
          // New blocks format
          return day.some((block: any) => block.exercises && block.exercises.length > 0);
        } else if (day && !day.is_rest_day) {
          // Old format
          return day.exercises && day.exercises.length > 0;
        }
        return false;
      });
      
      if (firstAvailableDay) {
        if (Array.isArray(firstAvailableDay)) {
          // New blocks format
          exerciseList = firstAvailableDay.flatMap((block: any) => {
            const exercises = block.exercises || [];
            // Copy block-level metadata to individual exercises if they don't have it
            return exercises.map((exercise: any) => ({
              ...exercise,
              sets: exercise.sets || block.sets || exercise.Sets || block.Sets || 1,
              reps: exercise.reps || block.reps || exercise.Reps || block.Reps || 1,
              rest: exercise.rest || block.rest || exercise.Rest || block.Rest || 0
            }));
          });
        } else {
          // Old format
          exerciseList = (firstAvailableDay as any).exercises || [];
        }
      }
    }
    
    const result = {
      currentDay: currentDayName,
      foundTodaysWorkout: !!todaysWorkout,
      exerciseCount: exerciseList.length,
      exercises: exerciseList.map(ex => `${ex.name} (${ex.sets}x${ex.reps})`).join(', ')
    };
    
    setTestResult(JSON.stringify(result, null, 2));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Weekly Workout Data Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Data Structure</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Exercise Extraction</h2>
        <button
          onClick={testExerciseExtraction}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        >
          Run Test
        </button>
        
        {testResult && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {testResult}
            </pre>
          </div>
        )}
            </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Fixes Applied:</h3>
        <ul className="text-green-700 space-y-1">
          <li>• Fixed TypeScript linter errors in UnifiedAssignmentCard.tsx</li>
          <li>• Simplified weekly workout exercise extraction logic</li>
          <li>• Added proper fallback handling for missing workout days</li>
          <li>• Unified data structure processing between assignment card and execution modal</li>
          <li>• Added proper error handling and default values for sets/reps</li>
        </ul>
      </div>
    </div>
  );
};

export default WeeklyWorkoutTest; 